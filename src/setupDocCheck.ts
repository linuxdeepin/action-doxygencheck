import { existsSync } from "fs"
import * as core from '@actions/core'
import { getCheckResult, setCheckFailed, setCheckPassed } from "./check"

export async function setupDocCheck() {
    const outputFile = process.env.CHECK_RES as string

    if (!existsSync(outputFile)) {
        core.setFailed("coverxygen output file not exists !")
        return
    }

    try {
        let checkedRes = await getCheckResult()
        if (checkedRes.length === 0) {
            core.info("pr changed files look like has documented well!")
            return setCheckPassed()
        } else {
            return setCheckFailed(checkedRes)
        }
    } catch (error) {
        core.setFailed("Error type : " + error.name + "\nError : " + error.message)
    }

}