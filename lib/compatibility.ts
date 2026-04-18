type CandidateShape = {
  age: number | null;
  region: string | null;
  timezone: string | null;
  languages: string[];
  playstyles: string[];
  playTimes?: string[];
  gameProfiles: Array<{ gameId: string; rankLabel: string; gameName?: string }>;
};

export type CompatibilityDetails = {
  score: number;
  reasons: string[];
  sharedGameCount: number;
  sameRankCount: number;
  sameRegion: boolean;
  sharedPlaystyleCount: number;
  sharedPlaytimeCount: number;
};

export function computeCompatibilityDetails(
  viewer: CandidateShape,
  candidate: CandidateShape
): CompatibilityDetails {
  let score = 30;
  const reasons: string[] = [];

  const sharedGames = candidate.gameProfiles.filter((game) =>
    viewer.gameProfiles.some((ownGame) => ownGame.gameId === game.gameId)
  );
  score += Math.min(sharedGames.length * 18, 36);

  const sameRankGames = sharedGames.filter((game) =>
    viewer.gameProfiles.some(
      (ownGame) =>
        ownGame.gameId === game.gameId && ownGame.rankLabel === game.rankLabel
    )
  );

  if (sameRankGames.length) {
    score += Math.min(sameRankGames.length * 8, 16);
    reasons.push(
      sameRankGames[0]?.gameName
        ? `Same rank in ${sameRankGames[0].gameName}`
        : "Same rank"
    );
  }

  if (sharedGames.length) {
    reasons.push(
      sharedGames[0]?.gameName
        ? `Shared game: ${sharedGames[0].gameName}`
        : "Same game pool"
    );
  }

  const sharedLanguages = candidate.languages.filter((language) =>
    viewer.languages.includes(language)
  );
  score += Math.min(sharedLanguages.length * 8, 16);
  if (sharedLanguages.length) {
    reasons.push(`Shared language: ${sharedLanguages[0]}`);
  }

  const sharedTags = candidate.playstyles.filter((tag) =>
    viewer.playstyles.includes(tag)
  );
  score += Math.min(sharedTags.length * 6, 12);
  if (sharedTags.length) {
    reasons.push(`Similar playstyle: ${sharedTags[0]}`);
  }

  const sharedPlaytimes = (candidate.playTimes ?? []).filter((slot) =>
    (viewer.playTimes ?? []).includes(slot)
  );
  if (sharedPlaytimes.length) {
    score += Math.min(sharedPlaytimes.length * 5, 10);
    reasons.push(`Similar playtime: ${sharedPlaytimes[0]}`);
  }

  let sameRegion = false;
  if (viewer.region && candidate.region && viewer.region === candidate.region) {
    score += 10;
    sameRegion = true;
    reasons.push(`Same region: ${candidate.region}`);
  }

  if (
    viewer.age &&
    candidate.age &&
    Math.abs(viewer.age - candidate.age) <= 4
  ) {
    score += 8;
  }

  if (
    viewer.timezone &&
    candidate.timezone &&
    viewer.timezone === candidate.timezone
  ) {
    score += 6;
  }

  return {
    score: Math.min(score, 99),
    reasons: reasons.slice(0, 5),
    sharedGameCount: sharedGames.length,
    sameRankCount: sameRankGames.length,
    sameRegion,
    sharedPlaystyleCount: sharedTags.length,
    sharedPlaytimeCount: sharedPlaytimes.length,
  };
}

export function computeCompatibility(
  viewer: CandidateShape,
  candidate: CandidateShape
) {
  return computeCompatibilityDetails(viewer, candidate).score;
}
