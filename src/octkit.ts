import { getOctokit } from '@actions/github'
import { context } from '@actions/github'
import  { createAppAuth } from '@octokit/auth-app'
const { Octokit } = require('@octokit/rest');

const githubActionsDefaultToken = process.env.GITHUB_TOKEN as string
const personalAcessToken = process.env.PERSONAL_ACCESS_TOKEN as string
const appPivateKey = process.env.APP_PRIVATE_KEY as string
const appId = process.env.APP_ID as string

export function isPersonalAccessTokenPresent(): boolean {
  return (personalAcessToken !== undefined && personalAcessToken !== "")
}

export function isAppPrivateKeyPresent(): boolean {

    return (appPivateKey !== undefined &&  appId !== undefined && appPivateKey !== "" && appId !== "")
}

async function getAppToken(appId: string | number, appPivateKey: string) {
  let octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: appId,
      privateKey: appPivateKey,
    }
  })

  const app_installation = await octokit.rest.apps.getRepoInstallation({
    owner: context.repo.owner,
    repo: context.repo.repo
  });

  let { token } = await octokit.auth({
      type: "installation",
      installationId: app_installation.data.id
    });

  return token
}

async function getOctokitByAppSecret() {
  const token = await getAppToken(appId, appPivateKey)
  return getOctokit(token)
}

function getPATOctokit() {
  return getOctokit(personalAcessToken)
}

function getDefaultOctokit() {
  return getOctokit(githubActionsDefaultToken)
}

export async function getApprovedOctokit() {
  return await (isPersonalAccessTokenPresent()? getPATOctokit(): getOctokitByAppSecret())
}

export async function getOctokitClient() {
  if (isPersonalAccessTokenPresent()) {
      return getPATOctokit()
  } else if (isAppPrivateKeyPresent()) {
      return getOctokitByAppSecret()
  }
  return getDefaultOctokit()
}