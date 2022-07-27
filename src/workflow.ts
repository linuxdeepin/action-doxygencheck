import { context } from "@actions/github";
import { getApprovedOctokit, getOctokitClient } from "./octkit";
import * as core from '@actions/core'
import { owner, repo, prID } from './const' 

// Note: why this  re-run of the last failed CLA workflow status check is explained this issue https://github.com/cla-assistant/github-action/issues/39
export async function reRunLastWorkFlowIfRequired() {

    if (context.eventName === "pull_request") {
        core.debug(`rerun not required for event - pull_request`)
        return
    }

    const branch = await getBranchOfPullRequest()
    const workflowId = await getSelfWorkflowId()
    const runs = await listWorkflowRunsInBranch(branch, workflowId)

    if (runs.data.total_count > 0) {
        const run = runs.data.workflow_runs[0].id

        const isLastWorkFlowFailed: boolean = await checkIfLastWorkFlowFailed(run)
        if (isLastWorkFlowFailed) {
            core.debug(`Rerunning build run ${run}`)
            await reRunWorkflow(run).catch(error => core.error(`Error occurred when re-running the workflow: ${error}`))
        }
    }
}

async function getBranchOfPullRequest(): Promise<string> {
    const octokit = await getOctokitClient()
    const pullRequest = await octokit.pulls.get({
        owner: owner,
        repo: repo,
        pull_number: prID
    });

    return pullRequest.data.head.ref
}

async function getSelfWorkflowId(): Promise<number> {
    const octokit = await getApprovedOctokit()
    const workflowList = await octokit.actions.listRepoWorkflows({
        owner: owner,
        repo: repo,
    });

    const workflow = workflowList.data.workflows
        .find(w => w.name == context.workflow)

    if (!workflow) {
        throw new Error(`Unable to locate this workflow's ID in this repository, can't retrigger job..`)
    }
    return workflow.id
}

async function listWorkflowRunsInBranch(branch: string, workflowId: number): Promise<any> {
    const octokit = await getApprovedOctokit()
    console.debug(branch)
    const runs = await octokit.actions.listWorkflowRuns({
        owner: owner,
        repo: repo,
        branch,
        workflow_id: workflowId,
        event: 'pull_request_target'
    })
    return runs
}

async function reRunWorkflow(run: number): Promise<any> {
    const octokit = await getApprovedOctokit()
    await octokit.actions.reRunWorkflow({
            owner: owner,
            repo: repo,
            run_id: run
        })
}

async function checkIfLastWorkFlowFailed(run: number): Promise<boolean> {
    const octokit = await getApprovedOctokit()
    const response: any = await octokit.actions.getWorkflowRun({
        owner: owner,
        repo: repo,
        run_id: run
    })

    return response.data.conclusion == 'failure'

}