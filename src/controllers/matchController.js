const matchService = require('../services/matchService');

const createMatch = async (req, res) => {
  try {
    const userId = req.user.userId;
    const match = await matchService.createMatch(userId, req.body);
    res.status(201).json({ message: 'Partido creado exitosamente', match });
  } catch (error) {
    console.error('Error in createMatch:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      body: req.body,
    });
    res.status(500).json({ message: 'Error al crear el partido', error: error.message });
  }
};

const getMatches = async (req, res) => {
  try {
    const userId = req.user.userId;
    const matches = await matchService.getMatches(userId);
    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: 'Error al listar los partidos', error: error.message });
  }
};

const joinMatch = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const match = await matchService.joinMatch(userId, id);
    res.status(200).json({ message: 'Te has unido al partido exitosamente', match });
  } catch (error) {
    res.status(error.message.includes('no encontrado') || error.message.includes('Ya estás en este partido') ? 400 : 500).json({
      message: 'Error al unirse al partido',
      error: error.message,
    });
  }
};

const updateMatch = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const match = await matchService.updateMatch(userId, id, req.body);
    res.status(200).json({ message: 'Partido actualizado exitosamente', match });
  } catch (error) {
    res.status(error.message.includes('no encontrado') ? 404 : 500).json({
      message: 'Error al actualizar el partido',
      error: error.message,
    });
  }
};

const saveMatch = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const match = await matchService.saveMatch(userId, id, req.body);
    res.status(200).json({ message: 'Resultados guardados exitosamente', match });
  } catch (error) {
    res.status(error.message.includes('no encontrado') || error.message.includes('ya han sido guardados') ? 400 : 500).json({
      message: 'Error al guardar los resultados',
      error: error.message,
    });
  }
};

const deleteMatch = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    await matchService.deleteMatch(userId, id);
    res.status(200).json({ message: 'Partido eliminado exitosamente' });
  } catch (error) {
    res.status(error.message.includes('no encontrado') ? 404 : 500).json({
      message: 'Error al eliminar el partido',
      error: error.message,
    });
  }
};

module.exports = { createMatch, getMatches, joinMatch, updateMatch, saveMatch, deleteMatch };