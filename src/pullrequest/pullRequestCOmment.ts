import { getOctokitClient } from "../octkit";
import { owner, repo, prID } from '../const';


const BOT_NAME = "Doc Check bot"

const COMMENT_HEAD = "**" + BOT_NAME + "**\n"

async function getDocCheckBotComment()  {
    try {
        const response = await (await getOctokitClient()).issues.listComments({
            owner: owner,
            repo: repo,
            issue_number: prID
        })
        const reg = new RegExp("\\*+" + BOT_NAME + "\\*+")
        return response.data.find(comment => comment.body.match(reg))
    } catch (error) {
        throw new Error(`Error occured when getting  all the comments of the pull request: ${error.message}`)
    }
    
}

async function createOrUpdateComment(commitContent: string) {
    const octokit = await getOctokitClient()
    const docBotCOmmand = await getDocCheckBotComment()
    if (docBotCOmmand) {
        octokit.issues.updateComment({
            owner: owner,
            repo: repo,
            comment_id: docBotCOmmand.id,
            body: commitContent,
        })
    } else {
        octokit.issues.createComment({
            owner: owner,
            repo: repo,
            issue_number: prID,
            body: commitContent,
        })
    }
    
}

export async function botComment(content) {
    var comment = COMMENT_HEAD + content
    return createOrUpdateComment(comment)
}

export function formTable(checkedRes: Array<string[3]>): string {
    if (checkedRes.length === 0) {
        return ""
    }
    var res = "File|Line|Symbol|\n-|-|-|\n"
    checkedRes.forEach((check) =>{
        res += check[0] + "|" + parseInt(check[1]) + "|" + check[2] + "|\n"
    })
    return res
}
