
const {
  askBusinessAssistant,
} = require("../services/aiService");

// =====================================
// BUSINESS AI ASSISTANT
// =====================================

const chatWithBusinessAssistant = async (
  req,
  res
) => {
  try {
    const { question } = req.body;

    const result =
      await askBusinessAssistant({
        user: req.user,
        question,
      });

    return res.status(200).json({
      success: true,
      answer: result.answer,
      model: result.model,
      context: result.context,
    });
  } catch (error) {
    console.error(
      "AI Business Assistant Error:",
      error
    );

    const statusCode =
      error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message:
        error.message ||
        "Failed to process AI request.",
    });
  }
};

module.exports = {
  chatWithBusinessAssistant,
};