import { WebsocketManager } from '../../src/share/script/socket_manager';

describe("Execute Manager Test", () => {
    let socket:WebsocketManager | undefined

    beforeAll(() => {
        socket = new WebsocketManager(() => {}, () => {}, () => {}, () => {})
    })
    afterAll(() => {
        socket = undefined
    })
    test("Check init state", () => {
        
    })
})