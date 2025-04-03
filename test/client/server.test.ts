import { Client } from '../../src/share/client/client';

describe("Client Test", () => {
    let client:Client | undefined

    beforeAll(() => {
        client = new Client((str) => console.log(str), (str) => console.log(str))
        client.Init()
    })
    afterAll(() => {
        client?.Destroy()
        client = undefined
    })
    test("Check init state", () => {
        expect(client).toBeDefined()
        expect(client!.clients).toBe(0)
    })
})