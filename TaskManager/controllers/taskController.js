import { TaskModel } from "../models/Task.js";

export const createTask = async (req, res) => {
  try {
    const { title, description, priority, status, dueDate } = req.body;
    if (!title || !priority || !status) {
      return res.status(400).json({
        msg: "These fields are required",
      });
    }

    const task = await TaskModel.create({
      title,
      description,
      priority,
      status,
      dueDate,
    });
    return res.status(201).json({
      msg: "task created successfully",
      task,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error",
    });
  }
};

export const getTask = async (req, res) => {
  try {
    const id = req.params;
    if (!id) {
      return res.status(400).json({
        msg: "id is required",
      });
    }

    const getTask = await TaskModel.findById(id);

    if (!getTask) {
      return res.status(404).json({
        msg: "Task not found",
      });
    }

    return res.status(200).json({
      msg: "Task fetched successfully",
      getTask,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server error",
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id, title, description, priority, status, dueDate } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        msg: "Task ID is required",
      });
    }

    const findTask = await TaskModel.findById(id);

    if (!findTask) {
      return res.status(404).json({
        success: false,
        msg: "Task not found",
      });
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(
      id,
      {
        title,
        description,
        priority,
        status,
        dueDate,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json({
      success: true,
      msg: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update Task Error:", error);

    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        msg: "id is required",
      });
    }

    const deleteTask = await TaskModel.findByIdAndDelete(id);
    if (!deleteTask) {
      return res.status(400).json({
        msg: "Task not found",
      });
    }
    return res.status(200).json({
      msg: "Task deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error",
    });
  }
};
