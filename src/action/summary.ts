import * as core from '@actions/core'
export async function exportSummary(checkResult) {
    var table = [[{data: "file", header: true}, {data: "line", header: true}, {data: 'symbol', header: true}]]
    checkResult.forEach(element => {
        table.push(element)
    })
    await core.summary
    .addHeading("Document Coverage Check Result")
    .addTable(table)
    .write()
}
