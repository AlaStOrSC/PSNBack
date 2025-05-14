const Match = require('../models/Match');
const User = require('../models/User');

const createMatch = async (userId, { player2Username, player3Username, player4Username, date, time, city, weather, rainWarning }) => {
  const player1 = await User.findById(userId);
  if (!player1) {
    throw new Error('Usuario autenticado no encontrado');
  }

  const player2 = await User.findOne({ username: player2Username });
  if (!player2) {
    throw new Error(`El usuario ${player2Username} no existe`);
  }

  const player3 = await User.findOne({ username: player3Username });
  if (!player3) {
    throw new Error(`El usuario ${player3Username} no existe`);
  }

  const player4 = await User.findOne({ username: player4Username });
  if (!player4) {
    throw new Error(`El usuario ${player4Username} no existe`);
  }

  const match = new Match({
    userId,
    player1: userId,
    player2: player2._id,
    player3: player3._id,
    player4: player4._id,
    date,
    time,
    city,
    weather,
    rainWarning,
  });
  await match.save();

  return match;
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
    .populate('player1', 'username')
    .populate('player2', 'username')
    .populate('player3', 'username')
    .populate('player4', 'username')
    .sort({ date: -1 });

  return matches;
};

const updateMatch = async (userId, matchId, updates) => {
  const match = await Match.findOne({ _id: matchId, userId });
  if (!match) {
    throw new Error('Partido no encontrado o no autorizado');
  }

  if (updates.isSaved && updates.results) {
    await calculateScores(match, updates.results, userId);
  }

  Object.assign(match, { ...updates, updatedAt: Date.now() });
  await match.save();

  await match.populate('player1', 'username');
  await match.populate('player2', 'username');
  await match.populate('player3', 'username');
  await match.populate('player4', 'username');

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

  await match.populate('player1', 'username');
  await match.populate('player2', 'username');
  await match.populate('player3', 'username');
  await match.populate('player4', 'username');

  return match;
};

const deleteMatch = async (userId, matchId) => {
  const match = await Match.findOneAndDelete({ _id: matchId, userId });
  if (!match) {
    throw new Error('Partido no encontrado o no autorizado');
  }
  return match;
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

  if (match.player1.equals(currentUserId) || match.player2.equals(currentUserId)) {
    userTeam = [match.player1, match.player2];
    rivalTeam = [match.player3, match.player4];
  } else {
    userTeam = [match.player3, match.player4];
    rivalTeam = [match.player1, match.player2];
  }

  if (!match.statsCalculated) {
    if (result === 'won') {
      for (const playerId of userTeam) {
        await User.findByIdAndUpdate(
          playerId,
          {
            $inc: { matchesWon: 1, totalMatches: 1 },
            $set: { updatedAt: Date.now() },
          },
          { new: true }
        );
      }
      for (const playerId of rivalTeam) {
        await User.findByIdAndUpdate(
          playerId,
          {
            $inc: { matchesLost: 1, totalMatches: 1 },
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
            $inc: { matchesLost: 1, totalMatches: 1 },
            $set: { updatedAt: Date.now() },
          },
          { new: true }
        );
      }
      for (const playerId of rivalTeam) {
        await User.findByIdAndUpdate(
          playerId,
          {
            $inc: { matchesWon: 1, totalMatches: 1 },
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
            $inc: { matchesDrawn: 1, totalMatches: 1 },
            $set: { updatedAt: Date.now() },
          },
          { new: true }
        );
      }
    }

    match.statsCalculated = true;
  }

  const rival1 = await User.findById(rivalTeam[0]);
  const rival2 = await User.findById(rivalTeam[1]);

  const rivalAverageScore = (rival1.score + rival2.score) / 2;

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

module.exports = { createMatch, getMatches, updateMatch, saveMatch, deleteMatch };