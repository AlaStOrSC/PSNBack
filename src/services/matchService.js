const Match = require('../models/Match');
const User = require('../models/User');
const { getWeather } = require('./weatherService');

const createMatch = async (userId, { player2Username, player3Username, player4Username, date, time, city }) => {
  try {
    console.log('Buscando usuario autenticado:', { userId });
    const player1 = await User.findById(userId);
    console.log('Resultado de User.findById:', { player1 });
    if (!player1) {
      throw new Error('Usuario autenticado no encontrado');
    }

    let player2 = null;
    if (player2Username) {
      console.log('Buscando player2:', { player2Username });
      player2 = await User.findOne({ username: player2Username });
      if (!player2) {
        throw new Error(`El usuario ${player2Username} no existe`);
      }
    }

    let player3 = null;
    if (player3Username) {
      console.log('Buscando player3:', { player3Username });
      player3 = await User.findOne({ username: player3Username });
      if (!player3) {
        throw new Error(`El usuario ${player3Username} no existe`);
      }
    }

    let player4 = null;
    if (player4Username) {
      console.log('Buscando player4:', { player4Username });
      player4 = await User.findOne({ username: player4Username });
      if (!player4) {
        throw new Error(`El usuario ${player4Username} no existe`);
      }
    }

    console.log('Obteniendo clima para:', { city, date, time });
    const { weather, rainWarning } = await getWeather(city, date, time);

    const match = new Match({
      userId,
      player1: userId,
      player2: player2 ? player2._id : null,
      player3: player3 ? player3._id : null,
      player4: player4 ? player4._id : null,
      date,
      time,
      city,
      weather,
      rainWarning,
    });
    await match.save();

    await match.populate('player1', 'username');
    await match.populate('player2', 'username');
    await match.populate('player3', 'username');
    await match.populate('player4', 'username');

    return match;
  } catch (error) {
    console.error('Error in createMatch:', {
      message: error.message,
      stack: error.stack,
      userId,
      body: { player2Username, player3Username, player4Username, date, time, city },
    });
    throw error;
  }
};

const getMatches = async (userId) => {
  const matches = await Match.find({
    $or: [
      { userId },
      { player1: userId },
      { player2: userId },
      { player3: userId },
      { player4: userId },
    ],
  })
    .populate('player1', 'username score profilePicture')
    .populate('player2', 'username score profilePicture')
    .populate('player3', 'username score profilePicture')
    .populate('player4', 'username score profilePicture')
    .sort({ date: -1 });

  return matches;
};

const joinMatch = async (userId, matchId) => {
  const match = await Match.findById(matchId);
  if (!match) {
    throw new Error('Partido no encontrado');
  }

  const userAlreadyInMatch = [
    match.player1,
    match.player2,
    match.player3,
    match.player4,
  ].some(player => player && player.equals(userId));
  if (userAlreadyInMatch) {
    throw new Error('Ya estás en este partido');
  }

  if (!match.player2) {
    match.player2 = userId;
  } else if (!match.player3) {
    match.player3 = userId;
  } else if (!match.player4) {
    match.player4 = userId;
  } else {
    throw new Error('No hay posiciones libres en este partido');
  }

  await match.save();

  await match.populate('player1', 'username score profilePicture');
  await match.populate('player2', 'username score profilePicture');
  await match.populate('player3', 'username score profilePicture');
  await match.populate('player4', 'username score profilePicture');

  return match;
};

const updateMatch = async (userId, matchId, updates) => {
  const match = await Match.findOne({ _id: matchId, userId });
  if (!match) {
    throw new Error('Partido no encontrado o no autorizado');
  }

  if (updates.player2) {
    const player2 = await User.findOne({ username: updates.player2 });
    if (!player2) {
      throw new Error(`El usuario ${updates.player2} no existe`);
    }
    updates.player2 = player2._id;
  } else if (updates.player2 === null) {
    updates.player2 = null;
  }

  if (updates.player3) {
    const player3 = await User.findOne({ username: updates.player3 });
    if (!player3) {
      throw new Error(`El usuario ${updates.player3} no existe`);
    }
    updates.player3 = player3._id;
  } else if (updates.player3 === null) {
    updates.player3 = null;
  }

  if (updates.player4) {
    const player4 = await User.findOne({ username: updates.player4 });
    if (!player4) {
      throw new Error(`El usuario ${updates.player4} no existe`);
    }
    updates.player4 = player4._id;
  } else if (updates.player4 === null) {
    updates.player4 = null;
  }

  if (updates.date || updates.time || updates.city) {
    const { weather, rainWarning } = await getWeather(
      updates.city || match.city,
      updates.date || match.date.split('T')[0],
      updates.time || match.time
    );
    updates.weather = weather;
    updates.rainWarning = rainWarning;
  }

  if (updates.isSaved && updates.results) {
    await calculateScores(match, updates.results, userId);
  }

  Object.assign(match, { ...updates, updatedAt: Date.now() });
  await match.save();

  await match.populate('player1', 'username score profilePicture');
  await match.populate('player2', 'username score profilePicture');
  await match.populate('player3', 'username score profilePicture');
  await match.populate('player4', 'username score profilePicture');

  return match;
};

const saveMatch = async (userId, matchId, updates) => {
  const match = await Match.findOne({
    _id: matchId,
    $or: [
      { player1: userId },
      { player2: userId },
      { player3: userId },
      { player4: userId },
    ],
  });

  if (!match) {
    throw new Error('Partido no encontrado o no autorizado');
  }

  if (match.isSaved) {
    throw new Error('Los resultados de este partido ya han sido guardados');
  }

  if (updates.isSaved && updates.results) {
    await calculateScores(match, updates.results, userId);
  }

  Object.assign(match, { ...updates, updatedAt: Date.now() });
  await match.save();

  await match.populate('player1', 'username score profilePicture');
  await match.populate('player2', 'username score profilePicture');
  await match.populate('player3', 'username score profilePicture');
  await match.populate('player4', 'username score profilePicture');

  return match;
};

const deleteMatch = async (userId, matchId) => {
  const match = await Match.findOneAndDelete({
    _id: matchId,
    $or: [
      { player1: userId },
      { player2: userId },
      { player3: userId },
      { player4: userId },
    ],
  });
  if (!match) {
    throw new Error('Partido no encontrado o no autorizado');
  }
  return match;
};

const deleteExpiredMatchesWithEmptySlots = async () => {
  try {
    const now = new Date();
    const matches = await Match.find({
      $or: [
        { player2: null },
        { player3: null },
        { player4: null },
      ],
    });

    for (const match of matches) {
      const matchDateTime = new Date(`${match.date.toISOString().split('T')[0]}T${match.time}`);
      if (matchDateTime <= now) {
        await Match.deleteOne({ _id: match._id });
        console.log(`Partido eliminado automáticamente por huecos vacíos: ${match._id}`);
      }
    }
  } catch (error) {
    console.error('Error al eliminar partidos con huecos vacíos:', error);
  }
};

const calculateScores = async (match, results, currentUserId) => {
  const setsWon = Object.values(results).reduce((won, set) => {
    if (set.left > set.right) return won + 1;
    if (set.right > set.left) return won - 1;
    return won;
  }, 0);

  let result;
  if (setsWon > 0) result = 'won';
  else if (setsWon < 0) result = 'lost';
  else result = 'draw';

  match.result = result;

  let userTeam = [];
  let rivalTeam = [];

  if (match.player1.equals(currentUserId) || match.player2?.equals(currentUserId)) {
    userTeam = [match.player1, match.player2].filter(player => player);
    rivalTeam = [match.player3, match.player4].filter(player => player);
  } else {
    userTeam = [match.player3, match.player4].filter(player => player);
    rivalTeam = [match.player1, match.player2].filter(player => player);
  }

  if (!match.statsCalculated) {
    if (result === 'won') {
      for (const playerId of userTeam) {
        await User.findByIdAndUpdate(
          playerId,
          {
            $inc: { matchesWon: 1, totalMatches: 1, points: 10 },
            $set: { updatedAt: Date.now() },
          },
          { new: true }
        );
      }
      for (const playerId of rivalTeam) {
        await User.findByIdAndUpdate(
          playerId,
          {
            $inc: { matchesLost: 1, totalMatches: 1, points: 2 },
            $set: { updatedAt: Date.now() },
          },
          { new: true }
        );
      }
    } else if (result === 'lost') {
      for (const playerId of userTeam) {
        await User.findByIdAndUpdate(
          playerId,
          {
            $inc: { matchesLost: 1, totalMatches: 1, points: 2 },
            $set: { updatedAt: Date.now() },
          },
          { new: true }
        );
      }
      for (const playerId of rivalTeam) {
        await User.findByIdAndUpdate(
          playerId,
          {
            $inc: { matchesWon: 1, totalMatches: 1, points: 10 },
            $set: { updatedAt: Date.now() },
          },
          { new: true }
        );
      }
    } else {
      for (const playerId of [...userTeam, ...rivalTeam]) {
        await User.findByIdAndUpdate(
          playerId,
          {
            $inc: { matchesDrawn: 1, totalMatches: 1, points: 5 },
            $set: { updatedAt: Date.now() },
          },
          { new: true }
        );
      }
    }

    match.statsCalculated = true;
  }

  const rivalPlayers = await Promise.all(rivalTeam.map(playerId => User.findById(playerId)));
  const rivalScores = rivalPlayers.map(player => player ? player.score : 0);
  const rivalAverageScore = rivalScores.length > 0 ? rivalScores.reduce((sum, score) => sum + score, 0) / rivalScores.length : 0;

  const basePoints = 1.0;
  let userScoreAdjustment;
  let rivalScoreAdjustment;

  if (result === 'won') {
    userScoreAdjustment = basePoints * (rivalAverageScore / 10);
    rivalScoreAdjustment = -basePoints * ((10 - rivalAverageScore) / 10);
  } else if (result === 'lost') {
    userScoreAdjustment = -basePoints * ((10 - rivalAverageScore) / 10);
    rivalScoreAdjustment = basePoints * (rivalAverageScore / 10);
  } else {
    return;
  }

  for (const playerId of userTeam) {
    const player = await User.findById(playerId);
    let newScore = player.score + userScoreAdjustment;

    if (newScore > 10) newScore = 10;
    if (newScore < 0) newScore = 0;

    player.score = parseFloat(newScore.toFixed(2));
    await player.save();
  }

  for (const playerId of rivalTeam) {
    const player = await User.findById(playerId);
    let newScore = player.score + rivalScoreAdjustment;

    if (newScore > 10) newScore = 10;
    if (newScore < 0) newScore = 0;

    player.score = parseFloat(newScore.toFixed(2));
    await player.save();
  }
};

const getJoinableMatches = async () => {
  try {
    const allMatches = await Match.find({}).populate('player1', 'username score profilePicture');
    console.log('All matches in database:', allMatches.map(m => ({
      _id: m._id,
      player1: m.player1?._id?.toString(),
      player2: m.player2?.toString() || null,
      player3: m.player3?.toString() || null,
      player4: m.player4?.toString() || null,
      date: m.date,
      time: m.time,
      city: m.city,
    })));

    const matches = await Match.find({
      $or: [
        { player2: null },
        { player3: null },
        { player4: null },
      ],
    })
      .populate('player1', 'username score profilePicture')
      .populate('player2', 'username score profilePicture')
      .populate('player3', 'username score profilePicture')
      .populate('player4', 'username score profilePicture')
      .sort({ date: -1 });

    console.log('Joinable matches found:', matches.map(m => ({
      _id: m._id,
      player1: m.player1?._id?.toString(),
      player2: m.player2?.toString() || null,
      player3: m.player3?.toString() || null,
      player4: m.player4?.toString() || null,
      date: m.date,
      time: m.time,
      city: m.city,
    })));

    return matches;
  } catch (error) {
    console.error('Error in getJoinableMatches:', error);
    throw error;
  }
};

module.exports = { createMatch, getMatches, updateMatch, saveMatch, deleteMatch, deleteExpiredMatchesWithEmptySlots, joinMatch, getJoinableMatches };