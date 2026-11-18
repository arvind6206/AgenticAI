import Groq from "groq-sdk";

export const chatController = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({
        msg: "prompt is required",
      });
    }
    const groq = new Groq();

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return res.status(200).json({
      msg: completion.choices[0]?.message?.content,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: `chat controller error ${error}`,
    });
  }
};
