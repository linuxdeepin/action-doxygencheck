import { getFailed } from './const'
import { setupDocCheck } from './setupDocCheck'

async function main() {
    console.log(getFailed())
    await setupDocCheck()
}
main()