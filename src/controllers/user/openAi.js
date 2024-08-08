// usageController.js
const axios = require('axios');

const BASE_URL = 'https://api.openai.com/v1';
const HEADERS = {
  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  'Content-Type': 'application/json'
};

const apiRequest = async (method, url, data = null) => {
  try {
    const response = await axios({ method, url, headers: HEADERS, data });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

const usageController = {
	getTokenUsageData: async (req, res) => {
    const { start_date, end_date } = req.query;
    const url = `${BASE_URL}/usage?start_date=${start_date}&end_date=${end_date}`;
    try {
      const data = await apiRequest('GET', url);
      res.json(data);
    } catch (error) {
      res.status(400).json(error);
    }
  },
  // User controllers
  listUsers: async (req, res) => {
    const { limit = 20, after } = req.query;
    const url = `${BASE_URL}/users?limit=${limit}&after=${after || ''}`;
    try {
      const data = await apiRequest('GET', url);
      res.json(data);
    } catch (error) {
      res.status(400).json(error);
    }
  },

  retrieveUser: async (req, res) => {
    const { user_id } = req.params;
    const url = `${BASE_URL}/users/${user_id}`;
    try {
      const data = await apiRequest('GET', url);
      res.json(data);
    } catch (error) {
      res.status(400).json(error);
    }
  },

  modifyUser: async (req, res) => {
    const { user_id } = req.params;
    const { role } = req.body;
    const url = `${BASE_URL}/users/${user_id}`;
    try {
      const data = await apiRequest('POST', url, { role });
      res.json(data);
    } catch (error) {
      res.status(400).json(error);
    }
  },

  deleteUser: async (req, res) => {
    const { user_id } = req.params;
    const url = `${BASE_URL}/users/${user_id}`;
    try {
      const data = await apiRequest('DELETE', url);
      res.json(data);
    } catch (error) {
      res.status(400).json(error);
    }
  },

  // Project controllers
  listProjects: async (req, res) => {
    const { limit = 20, after, include_archived = false } = req.query;
    const url = `${BASE_URL}/projects?limit=${limit}&after=${after || ''}&include_archived=${include_archived}`;
    try {
      const data = await apiRequest('GET', url);
      res.json(data);
    } catch (error) {
      res.status(400).json(error);
    }
  },

  createProject: async (req, res) => {
    const { name } = req.body;
    const url = `${BASE_URL}/projects`;
    try {
      const data = await apiRequest('POST', url, { name });
      res.json(data);
    } catch (error) {
      res.status(400).json(error);
    }
  },

  retrieveProject: async (req, res) => {
    const { project_id } = req.params;
    const url = `${BASE_URL}/projects/${project_id}`;
    try {
      const data = await apiRequest('GET', url);
      res.json(data);
    } catch (error) {
      res.status(400).json(error);
    }
  },

  modifyProject: async (req, res) => {
    const { project_id } = req.params;
    const { name } = req.body;
    const url = `${BASE_URL}/projects/${project_id}`;
    try {
      const data = await apiRequest('POST', url, { name });
      res.json(data);
    } catch (error) {
      res.status(400).json(error);
    }
  },

  archiveProject: async (req, res) => {
    const { project_id } = req.params;
    const url = `${BASE_URL}/projects/${project_id}/archive`;
    try {
      const data = await apiRequest('POST', url);
      res.json(data);
    } catch (error) {
      res.status(400).json(error);
    }
  },

  // Project User controllers
  listProjectUsers: async (req, res) => {
    const { project_id } = req.params;
    const { limit = 20, after } = req.query;
    const url = `${BASE_URL}/projects/${project_id}/users?limit=${limit}&after=${after || ''}`;
    try {
      const data = await apiRequest('GET', url);
      res.json(data);
    } catch (error) {
      res.status(400).json(error);
    }
  }
};

module.exports = usageController;