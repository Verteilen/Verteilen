import { WebsocketManager } from '../../src/share/script/socket_manager';

describe("Execute Manager Test", () => {
    let socket:WebsocketManager | undefined

    beforeAll(() => {
        /**
        socket = new WebsocketManager(
            () => {}, 
            () => {}, 
            () => {}, 
            () => {}, {
                shellReply: (d) => {},
                folderReply: (d) => {}
            })
         */
    })
    afterAll(() => {
        socket = undefined
    })
    test("Check init state", () => {
        /**
        expect(socket).toBeDefined()
        expect(socket!.targets.length).toBe(0)
        */
    })
})