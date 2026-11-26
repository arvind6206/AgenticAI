import { tool } from "langchain";
import * as z from "zod";

async function getUserProfile(userId){
    console.log(`getUserInfo tool called with userId: `, userId)
    const user = {
        id: userId,
        name: "John DOe",
        email: "john.doe@example.com",
        phone: "123456789",
        address: "123 Main St, Anytown, USA"
    }
    return JSON.stringify(user)
}

export const getUserProfileTool = tool(({userId}) => getUserProfile(userId), {
    name: "getUserProfile",
    description: "Get user profile information such as name, email, phone and address",
    schema: z.object({
        userId: z.string().describe("The ID of the user to get info for")
    })
})