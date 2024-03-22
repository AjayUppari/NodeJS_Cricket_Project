const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error is ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// Get all player details API
app.get("/players/", async (request, response) => {
  const getAllPlayers = `
    SELECT *
    FROM player_details
    ORDER BY player_id;`;

  const playersDetails = await db.all(getAllPlayers);
  response.send(
    playersDetails.map((eachPlayer) => {
      return {
        playerId: eachPlayer.player_id,
        playerName: eachPlayer.player_name,
      };
    })
  );
});

// Get specific player details API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerDetails = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};`;

  const playerDetails = await db.get(getSpecificPlayerDetails);
  response.send({
    playerId: playerDetails.player_id,
    playerName: playerDetails.player_name,
  });
});

// Update specific details of specific player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerNameDetails = request.body;
  const { playerName } = playerNameDetails;

  const updateSpecificDetails = `
  UPDATE
  player_details
  SET
  player_name = '${playerName}';
  WHERE player_id = ${playerId}`;

  await db.run(updateSpecificDetails);
  response.send("Player Details Updated");
});

// Get specific match details API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
    
    SELECT 
    match_id AS matchId,
    match,
    year
    FROM match_details
    WHERE match_id = ${matchId};`;

  const matchDetails = await db.get(getMatchDetails);
  response.send(matchDetails);
});

// Get all matches of a player
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesOfPLayer = `
    SELECT 
    *
    FROM player_match_score
    NATURAL JOIN match_Details
    WHERE player_id = ${playerId};`;

  const matchesDetails = await db.all(getMatchesOfPLayer);
  response.send(
    matchesDetails.map((eachMatch) => {
      return {
        matchId: eachMatch.match_id,
        match: eachMatch.match,
        year: eachMatch.year,
      };
    })
  );
});

// Get list of players of specific match
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;

  const playersDetailsList = await db.all(getMatchPlayersQuery);
  response.send(playersDetailsList);
});

// Get statistics of player
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;

  const playerStats = await db.get(getPlayerScored);
  console.log(playerStats);
  response.send(playerStats);
});

module.exports = app;
