import { ClientJobExecute } from "../../src/share/client/job_execute"
import { Job, JobCategory, JobType2 } from "../../src/share/interface"


describe("Client Execute Test", () => {
    let execute:ClientJobExecute | undefined = undefined
    let job:Job | undefined = undefined
    afterAll(() => {
        execute = undefined
    })

    test("Testing condition (OS when path not exist)", async () => {
        job = {
            index: 0,
            uuid: "UUID",
            runtime_uuid: "Runtime",
            category: JobCategory.Condition,
            type: JobType2.CHECK_PATH,
            script: "",
            string_args: ["Not Exist"],
            number_args: [],
            boolean_args: []
        }
        execute = new ClientJobExecute(
            (str) => console.log(str),
            (str) => console.log(str),
            job!,
            undefined,
            { plugins: [] },
        )
        await expect(execute.execute()).rejects.toBeDefined()
    })
    test("Testing condition (OS when path exist)", async () => {
        job = {
            index: 0,
            uuid: "UUID",
            runtime_uuid: "Runtime",
            category: JobCategory.Condition,
            type: JobType2.CHECK_PATH,
            script: "",
            string_args: [process.cwd()],
            number_args: [],
            boolean_args: []
        }
        execute = new ClientJobExecute(
            (str) => console.log(str),
            (str) => console.log(str),
            job!,
            undefined,
            { plugins: [] }
        )
        await expect(execute.execute()).resolves.toBeDefined()
    })
})