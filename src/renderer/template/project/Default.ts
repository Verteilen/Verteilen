import { Parameter, Project } from "../../interface"

export const GetDefaultProjectTemplate = (r:Project):Project => {
    const para:Parameter = {
        numbers: [
            { name: "n1", value: 120 }
        ],
        strings: [
            { name: "s1", value: "Hello World" }
        ],
        booleans: [
            { name: "b1", value: false }
        ],
    }
    r.parameter = para
    return r
}