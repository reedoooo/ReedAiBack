// services/workspaceService.js
const fs = require('fs');
const path = require('path');
const { Workspace, User } = require('../../../models');

const createHomeWorkspace = async userId => {
  try {
    const homeWorkspace = new Workspace({
      userId,
      name: 'Home Workspace',
      description: 'Default home workspace',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await homeWorkspace.save();
    return homeWorkspace._id;
  } catch (error) {
    console.error('Error creating home workspace:', error.message);
    throw new Error('Error creating home workspace');
  }
};

const uploadWorkspaceImage = async (workspaceId, imagePath) => {
  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (workspace.imagePath) {
      fs.unlink(path.join(__dirname, '..', workspace.imagePath), err => {
        if (err) console.error('Error deleting old image:', err);
      });
    }

    workspace.imagePath = imagePath;
    await workspace.save();

    return workspace.imagePath;
  } catch (error) {
    console.error('Error uploading image:', error.message);
    throw new Error('Error uploading image');
  }
};

const getWorkspaceImage = async workspaceId => {
  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.imagePath) {
      throw new Error('Image not found');
    }

    return path.resolve(workspace.imagePath);
  } catch (error) {
    console.error('Error retrieving image:', error.message);
    throw new Error('Error retrieving image');
  }
};

const getHomeWorkspaceByUserId = async userId => {
  try {
    const user = await User.findById(userId).populate('homeWorkspace');
    if (!user || !user.homeWorkspace) {
      throw new Error('Home workspace not found');
    }
    return user.homeWorkspace;
  } catch (error) {
    console.error('Error fetching home workspace:', error.message);
    throw new Error('Error fetching home workspace');
  }
};

const getWorkspaceById = async workspaceId => {
  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    return workspace;
  } catch (error) {
    console.error('Error fetching workspace:', error.message);
    throw new Error('Error fetching workspace');
  }
};

const getWorkspacesByUserId = async userId => {
  try {
    const workspaces = await Workspace.find({ userId }).sort({ createdAt: -1 });
    if (!workspaces.length) {
      throw new Error('Workspaces not found');
    }
    return workspaces;
  } catch (error) {
    console.error('Error fetching workspaces:', error.message);
    throw new Error('Error fetching workspaces');
  }
};

const createWorkspace = async workspaceData => {
  try {
    const createdWorkspace = await Workspace.create(workspaceData);
    return createdWorkspace;
  } catch (error) {
    console.error('Error creating workspace:', error.message);
    throw new Error('Error creating workspace');
  }
};

const updateWorkspace = async (workspaceId, workspaceData) => {
  try {
    const updatedWorkspace = await Workspace.findByIdAndUpdate(workspaceId, workspaceData, { new: true });
    if (!updatedWorkspace) {
      throw new Error('Workspace not found');
    }
    return updatedWorkspace;
  } catch (error) {
    console.error('Error updating workspace:', error.message);
    throw new Error('Error updating workspace');
  }
};

const deleteWorkspace = async workspaceId => {
  try {
    const deletedWorkspace = await Workspace.findByIdAndDelete(workspaceId);
    if (!deletedWorkspace) {
      throw new Error('Workspace not found');
    }
    return { message: 'Workspace deleted successfully' };
  } catch (error) {
    console.error('Error deleting workspace:', error.message);
    throw new Error('Error deleting workspace');
  }
};

module.exports = {
  createHomeWorkspace,
  uploadWorkspaceImage,
  getWorkspaceImage,
  getHomeWorkspaceByUserId,
  getWorkspaceById,
  getWorkspacesByUserId,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
};
