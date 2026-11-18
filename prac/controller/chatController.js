import { GoogleGenAI } from "@google/genai";

export const chatController = async (req, res) => {
  try {
    const {prompt} = req.body;
    if(!prompt){
        return res.status(400).json({
            msg: "prompt is required"
        })
    }
    const ai = new GoogleGenAI({});

    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
       input: `
        You are a helpful AI assistant.

        Answer the user's question in clean plain text.

        Follow these rules:
        1. Do not use Markdown formatting.
        2. Do not use asterisks (** or *).
        3. Do not use hashtags (#).
        4. Do not use backticks.
        5. Do not use horizontal separators (---).
        6. Avoid unnecessary special characters.
        7. Use simple paragraphs and natural language.
        8. Use numbered lists when necessary.
        9. Don't use \n and any types of special symbol just use simple and plain text.

        User question: ${prompt}
      `,
      generation_config: {
        thinking_level: "high"
      }
    });

    return res.status(200).json({
        msg: interaction.output_text
    })

    
  } catch (error) {
    console.log(error)
    return res.status(500).json({
        msg: `chat controller error ${error}`
    })
  }
};
