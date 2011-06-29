/*
* modules.js
* This file lists all modules of FoxTrick.
*
* Modules that need to be initialized and register their page handlers
* in the beginning.
* Each should implement an init() method, which will be called only once.
* And there should also be run(page, doc) and change(page, doc) functions,
* which are called when the page is loaded or changed, respectively.
*/

if (!Foxtrick) var Foxtrick={};

Foxtrick.modules = [
	FoxtrickCore,
	FoxtrickHelper,
	Foxtrick.ApiProxy,
	FoxtrickReadHtPrefs,
	FoxtrickPrefsDialogHTML,
	FoxtrickOnPagePrefs,
	Foxtrick.AddClass, // place before all date-related modules
	FoxtrickForumStripHattrickLinks,
	FoxtrickForumChangePosts,
	FoxtrickShowForumPrefButton,
	FoxtrickMovePlayerSelectbox,  // keep before others on playerdetails page
	FoxtrickManagerButtons,   // keep before FoxtrickAddDefaultFaceCard
	FoxtrickMovePlayerStatement,
	FoxtrickFixcssProblems,
	FoxtrickSimplePresentation,
	FoxtrickForumPresentation,
	FoxtrickForumTemplates,
	FoxtrickForumPreview,
	FoxtrickForumYouthIcons,
	Foxtrick.BookmarkAdjust,
	FoxtrickAddDefaultFaceCard,
	FoxtrickMoveLinks,
	FoxtrickForumAlterHeaderLine,
	FoxtrickTeamPopupLinks,
	FoxtrickGoToPostBox,
	FoxtrickCopyYouth,
	FoxtrickFormatPostingText,
	FoxtrickCopyPostID,
	FoxtrickStaffMarker,
	FoxtrickHTThreadMarker,
	FoxtrickMedianTransferPrice,
	FoxtrickAddLeaveConfButton,
	FoxtrickStarsCounter,
	FoxtrickFlagCollectionToMap,
	FoxtrickTransferSearchFilters,
	FoxtrickTransferSearchResultFilters, // keep before TransferDeadline and HTMSPoints
	FoxtrickTransferDeadline,
	FoxtrickExtendedPlayerDetails,
	FoxtrickLastLogin,
	FoxtrickExtendedPlayerDetailsWage,
	FoxtrickMatchReportFormat,
	FoxtrickMatchPlayerColouring,
	Foxtrick.AttVsDef, // AttVsDef should be placed before Ratings
	Foxtrick.Ratings,
	FoxtrickHTMSPrediction,
	FoxtrickSkillTable,
	Foxtrick.TeamStats,  // before FoxtrickLinksPlayers
	FoxtrickOriginalFace,
	FoxtrickBackgroundFixed,
	FoxtrickCopyPlayerAd,
	FoxtrickCopyRatings,
	FoxtrickMyMonitor,
	FoxtrickLinksLeague,
	FoxtrickLinksCountry,
	FoxtrickLinksTeam,
	FoxtrickLinksChallenges,
	FoxtrickLinksEconomy,
	FoxtrickLinksYouthOverview,
	FoxtrickLinksYouthTraining,
	FoxtrickLinksYouthPlayerDetail,
	FoxtrickLinksYouthMatchList,
	FoxtrickLinksYouthPlayerList,
    FoxtrickLinksYouthLeague,
	FoxtrickLinksArena,
	FoxtrickLinksCoach,
	FoxtrickLinksPlayerDetail,
	FoxtrickLinksMatch,
	FoxtrickLinksTraining,
	FoxtrickLinksAlliances,
	FoxtrickLinksNational,
	FoxtrickLinksManager,
	FoxtrickLinksAchievements,
	FoxtrickLinksPlayers,
	FoxtrickLinksFans,
	FoxtrickLinksStaff,
	FoxtrickLinksTracker,
	FoxtrickLinksClubTransfers,
	FoxtrickConfirmActions,
	FoxtrickHideSignatures,
	FoxtrickMarkUnread,
	FoxtrickForumNextAndPrevious,
	FoxtrickForumLastPost,
	FoxtrickPersonalityImages,
	FoxtrickSkillColoring,
	FoxtrickMatchIncome,
	FoxtrickLargeFlags,
	FoxtrickTeamSelectBox,
	FoxtrickSeniorTeamShortCuts,
	FoxtrickExtraShortcuts,
	FoxtrickCustomMedals,
	FoxtrickForumRedirManagerToTeam,
	FoxtrickRedirections,
	FoxtrickCurrencyConverter,
	FoxtrickTickerColoring,
	FoxtrickSeasonStats,   // keep before FoxtrickCopyMatchID
	FoxtrickHistoryStats,   // keep before FoxtrickCopyMatchID
	FoxtrickCopyMatchID,
	FoxtrickHeaderFix,
	FoxtrickHeaderFixLeft,
	FoxtrickNewMail,
	FoxtrickPlayerBirthday,
	FoxtrickLeagueNewsFilter,
	FoxtrickCopyPosting,
	FoxtrickMoveManagerOnline,
	FoxtrickGoalDifferenceToTables,
	FoxtrickMatchTables,
	FoxtrickCrossTable,
	FoxtrickYouthSkillHideUnknown,
	FoxtrickHighlightCupwins,
	FoxtrickElectionTable,
	FoxtrickSkillTranslation,
	FoxtrickLineupShortcut,
	FoxtrickYouthPromotes,
	FoxtrickCountyList,
	FoxtrickSmallerPages, //after FoxtrickTransferDeadline and probably also after all other player detail adjustment, so keep it in the end
	FoxtrickHighlightOwnerless,
	FoxtrickLeagueAndMatchChat,
	FoxtrickRapidId,
	FoxtrickForumStage,
	FoxtrickExtraPlayerInfo,
	FoxtrickPlayerFilters,
	FoxtrickYouthSeriesEstimation,
	FoxtrickForumThreadAutoIgnore,
	FoxtrickTableSort,
	FoxtrickLiveAlert,
	FoxtrickOldStyleFace,
	FoxtrickNtPeek,
	FoxtrickSeriesFlags,
	FoxtrickHTMSPoints,
	FoxtrickFriendlyInterface,
	FoxtrickMarkAllAsRead,
	FoxtrickShowFriendlyBooked,
	FoxtrickShowLineupSet,
	FoxtrickSupporterStatsEnhancements,
	FoxtrickLocalTime, // place before HTDateFormat, bellow everything that adds dates
	FoxtrickHTDateFormat,
	FoxtrickTickerAlert // place below all other modules that make changes to #ticker	
];

if (Foxtrick.BuildFor == "Gecko") {
	// Gecko-only modules
	Foxtrick.modules.push(FoxtrickSkinPlugin);
	Foxtrick.modules.push(FoxtrickContextMenuCopy);
}
