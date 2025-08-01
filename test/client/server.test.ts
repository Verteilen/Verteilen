import { Client } from '../../src/share/client/client';
import { i18n } from '../../src/share/plugins/i18n';

describe("Client Test", () => {
    let client:Client | undefined

    beforeAll(() => {
        /**
        client = new Client((str) => console.log(str), (str) => console.log(str))
        client.Init()
         */
    })
    afterAll(() => {
        /**
        client!.Destroy()
        client!.Dispose()
        client = undefined
        i18n.dispose()
         */
    })
    test("Check init state", () => {
        /**
        expect(client).toBeDefined()
        expect(client!.clients.length).toBe(0)
         */
    })
})