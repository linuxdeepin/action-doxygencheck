import { context } from "@actions/github";
import { getOctokitClient } from "./octkit";
import * as core from '@actions/core'
import { exportSummary } from "./action/summary";
import { botComment, formTable } from "./pullrequest/pullRequestCOmment";
import { reRunLastWorkFlowIfRequired } from "./workflow";
import { prID, owner, repo, getCheckFileSuffix, getFailed } from './const'
const { parsePatch } = require('diff');
const { readFileSync } = require('fs')

const checkFilePrefix = process.cwd() + "/"
const outputFile = process.env.CHECK_RES as string

const STATUS = {
    passed: ":green_circle:",
    warning: ":yellow_circle:",
    error: ":red_circle:"
}

export async function getCheckResult(): Promise<Array<string[3]>> {
    var res = new Array()
    const octokit = await getOctokitClient()
    const { data: prDiff } = await octokit.pulls.get({
        owner: owner,
        repo: repo,
        pull_number: prID,
        mediaType: {
            format: "diff",
        },
    });

    const diffs = parsePatch(prDiff)

    let data = readFileSync(outputFile, 'utf-8')
    let checkedResult = JSON.parse(data)

    diffs.forEach(file => {
        // foreach changed file
        const filename = file.newFileName.slice(2)
        if (needCheck(filename)) {
            file.hunks.forEach(line => {
                // foreach file changed line
                const startLine = parseInt(line.newStart + line.oldLines)
                const endLine = startLine + parseInt(line.newLines) - 1
                // try get check result from coverxygen output
                const currentFileCheckResult = checkedResult[checkFilePrefix + filename]
                if (currentFileCheckResult) {
                    currentFileCheckResult.forEach(checkedResult => {
                        // document is in diff
                        const checkedLine = parseInt(checkedResult.line)
                        // document is in patched line
                        if (checkedLine <= endLine && checkedLine >= startLine) {
                            if (!checkedResult.documented) {
                                var message = checkedResult.kind + " " + checkedResult.symbol + " is not documented!"
                                console.log(`::warning file=${filename},line=${checkedLine}::${message}`)
                                res.push([filename, checkedLine.toString(), checkedResult.symbol])
                            }
                        }
                    })
                }
            })
        }
    })
    return res
}

export async function setCheckFailed(checkedRes: Array<string[3]>){
    await exportSummary(checkedRes)
    const comment = STATUS.warning + " some documents missing!\n" + formTable(checkedRes)
    await botComment(comment)
    const failed = getFailed()
    if (failed) {
        await core.setFailed("There is something undocumented!")
    }
}

export async function setCheckPassed() {
    const comment = STATUS.passed + " Document Coverage Check Passed!\n"
    await botComment(comment)
    await core.info(comment)
    await reRunLastWorkFlowIfRequired()
}

function needCheck(filename) {
    var checkSuffixs = getCheckFileSuffix().split(',')
    for (const suffix of checkSuffixs) {
        if (filename.endsWith(suffix.trim())) {
            return true
        }
    }
    return false
}
