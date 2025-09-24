import { ClientJobParameter } from '../../src/share/client/job_parameter';
import { ClientOS } from '../../src/share/client/os';
import { DataType, Job, JobCategory, Libraries, JobType, Parameter, Property, Task } from '../../src/share/interface';
import { ExecuteManager_Base } from '../../src/share/script/execute/base';

describe("Express Test", () => {
    let os:ClientOS | undefined = undefined
    let para:ClientJobParameter | undefined = undefined
    let parameter:Parameter | undefined = undefined
    let lib:Libraries | undefined = undefined
    
    const generateJob = (str:Array<string>):Job => {
        return {
            uuid: "test-job",
            category: JobCategory.Execution,
            type: JobType.JAVASCRIPT,
            script: "",
            string_args: str,
            number_args: [],
            boolean_args: []
        }
    }
    const generateTask = (Job:Job, property:Array<Property>, cronjob?:string):Task => {
        return {
            uuid: "test-task",
            title: "Test Task",
            description: "This is a test task",
            setupjob: false,
            cronjob: cronjob ? true: false,
            cronjobKey: cronjob ?? "",
            multi: false,
            multiKey: "",
            properties: property,
            jobs: [Job],
        }
    }
    beforeEach(() => {
        os = new ClientOS(() => "", () => "", (str) => console.log(str), (str) => console.log(str))
        para = new ClientJobParameter()
        parameter = {
            uuid: "",
            title: "",
            canWrite: true,
            containers: [
                { name: "n1", type: DataType.Number, value: 7, hidden: false, runtimeOnly: false },
                { name: "n2", type: DataType.Number, value: 5, hidden: false, runtimeOnly: false },
                { name: "DATA_0", type: DataType.Number, value: 10, hidden: false, runtimeOnly: false },
                { name: "DATA_1", type: DataType.Number, value: 1000, hidden: false, runtimeOnly: false },
                { name: "HELLO_0", type: DataType.Number, value: 99, hidden: false, runtimeOnly: false },
                { name: "HELLO_1", type: DataType.Number, value: 9999, hidden: false, runtimeOnly: false },
                { name: "s1", type: DataType.String, value: "Hello World", hidden: false, runtimeOnly: false },
                { name: "b1", type: DataType.Boolean, value: true, hidden: false, runtimeOnly: false },
                { name: "e1", type: DataType.Expression, value: 0, meta: "n1+n2", hidden: false, runtimeOnly: false },
                { name: "b1", type: DataType.Object, value: {
                    data: [ { k: 5, p: 5, n: 5 }, { k: 10, p: 122, n: 5 } ]
                }, hidden: false, runtimeOnly: false },
            ]
        }
    })
    afterEach(() => {
        os = undefined
        para = undefined
        parameter = undefined
        lib = undefined
    })
    test("Property getter", () => {
        const job:Job = generateJob(["%e1%", "KKK %s1%", "%POS%"])
        const task:Task = generateTask(job, [{
            name: "POS",
            expression: "n1 + n2 + n1"
        }])
        ExecuteManager_Base.string_args_transform(task, job, (str) => console.log(str), parameter!, 1)
        expect(job.string_args[0]).toBe("12")
        expect(job.string_args[1]).toBe("KKK Hello World")
        expect(job.string_args[2]).toBe("19")
    })
    test("Nest getter", () => {
        const job:Job = generateJob(["%POS%", "Hello %POS_Deep%", "%POS_Deepp%"])
        const task:Task = generateTask(job, [
            {
                name: "POS",
                expression: `STRING(["b1.data.", ck, ".p"])`
            },
            {
                name: "POS_Deep",
                expression: "POS",
                deep: 2
            },
            {
                name: "POS_Deepp",
                expression: "POS_Deep + 1"
            }
        ])
        ExecuteManager_Base.string_args_transform(task, job, (str) => console.log(str), parameter!, 1)
        expect(job.string_args[0]).toBe("b1.data.1.p")
        expect(job.string_args[1]).toBe("Hello 122")
        expect(job.string_args[2]).toBe("123")
    })
    test("_ck_ getter 0", () => {
        const job:Job = generateJob(["%p1%", "%p2%"])
        const task:Task = generateTask(job, [
            {
                name: "p1",
                expression: `DATA__ck_`
            },
            {
                name: "p2",
                expression: "HELLO__ck_",
            },
        ])
        ExecuteManager_Base.string_args_transform(task, job, (str) => console.log(str), parameter!, 0)
        expect(job.string_args[0]).toBe("10")
        expect(job.string_args[1]).toBe("99")
    })
    test("_ck_ getter 1", () => {
        const job:Job = generateJob(["%p1%", "%p2%"])
        const task:Task = generateTask(job, [
            {
                name: "p1",
                expression: `DATA__ck_`
            },
            {
                name: "p2",
                expression: "HELLO__ck_",
            },
        ])
        ExecuteManager_Base.string_args_transform(task, job, (str) => console.log(str), parameter!, 1)
        expect(job.string_args[0]).toBe("1000")
        expect(job.string_args[1]).toBe("9999")
    })
    test("Cronjob Key Testing", () => {
        expect(ExecuteManager_Base.get_number_global("e1", parameter)).toBe(12)
        expect(ExecuteManager_Base.get_number_global("n1", parameter)).toBe(7)
        expect(ExecuteManager_Base.get_number_global("b1.data.0.p", parameter)).toBe(5)
    })
})