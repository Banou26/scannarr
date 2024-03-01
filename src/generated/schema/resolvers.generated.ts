/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
    import type   { Resolvers } from './types.generated';
    import    { Authenticate } from './resolvers/Authenticate';
import    { AuthenticateOauth2 } from './resolvers/AuthenticateOauth2';
import    { Authentication } from './resolvers/Authentication';
import    { AuthenticationMethod } from './resolvers/AuthenticationMethod';
import    { AuthenticationMethodHeaderValue } from './resolvers/AuthenticationMethodHeaderValue';
import    { CountryCode } from './resolvers/CountryCode';
import    { Date } from './resolvers/Date';
import    { Episode } from './resolvers/Episode';
import    { EpisodeConnection } from './resolvers/EpisodeConnection';
import    { EpisodeEdge } from './resolvers/EpisodeEdge';
import    { EpisodePage } from './resolvers/EpisodePage';
import    { FuzzyDate } from './resolvers/FuzzyDate';
import    { FuzzyDateInt } from './resolvers/FuzzyDateInt';
import    { Json } from './resolvers/Json';
import    { Media } from './resolvers/Media';
import    { MediaAiringSchedule } from './resolvers/MediaAiringSchedule';
import    { MediaAiringScheduleConnection } from './resolvers/MediaAiringScheduleConnection';
import    { MediaAiringScheduleEdge } from './resolvers/MediaAiringScheduleEdge';
import    { MediaConnection } from './resolvers/MediaConnection';
import    { MediaCoverImage } from './resolvers/MediaCoverImage';
import    { MediaEdge } from './resolvers/MediaEdge';
import    { MediaExternalLink } from './resolvers/MediaExternalLink';
import    { MediaPage } from './resolvers/MediaPage';
import    { MediaSynonym } from './resolvers/MediaSynonym';
import    { MediaTitle } from './resolvers/MediaTitle';
import    { MediaTrailer } from './resolvers/MediaTrailer';
import    { authenticate as Mutation_authenticate } from './resolvers/Mutation/authenticate';
import    { dummy as Mutation_dummy } from './resolvers/Mutation/dummy';
import    { Origin } from './resolvers/Origin';
import    { PlaybackSource } from './resolvers/PlaybackSource';
import    { PlaybackSourceConnection } from './resolvers/PlaybackSourceConnection';
import    { PlaybackSourceEdge } from './resolvers/PlaybackSourceEdge';
import    { PlaybackSourcePage } from './resolvers/PlaybackSourcePage';
import    { authentication as Query_authentication } from './resolvers/Query/authentication';
import    { dummy as Query_dummy } from './resolvers/Query/dummy';
import    { episode as Query_episode } from './resolvers/Query/episode';
import    { episodePage as Query_episodePage } from './resolvers/Query/episodePage';
import    { media as Query_media } from './resolvers/Query/media';
import    { mediaPage as Query_mediaPage } from './resolvers/Query/mediaPage';
import    { origin as Query_origin } from './resolvers/Query/origin';
import    { originPage as Query_originPage } from './resolvers/Query/originPage';
import    { playbackSource as Query_playbackSource } from './resolvers/Query/playbackSource';
import    { playbackSourcePage as Query_playbackSourcePage } from './resolvers/Query/playbackSourcePage';
import    { user as Query_user } from './resolvers/Query/user';
import    { userMediaPage as Query_userMediaPage } from './resolvers/Query/userMediaPage';
import    { Resource } from './resolvers/Resource';
import    { ResourceConnection } from './resolvers/ResourceConnection';
import    { ResourceEdge } from './resolvers/ResourceEdge';
import    { dummy as Subscription_dummy } from './resolvers/Subscription/dummy';
import    { mediaPage as Subscription_mediaPage } from './resolvers/Subscription/mediaPage';
import    { Team } from './resolvers/Team';
import    { Uri } from './resolvers/Uri';
import    { User } from './resolvers/User';
import    { UserMedia } from './resolvers/UserMedia';
import    { UserMediaEpisode } from './resolvers/UserMediaEpisode';
import    { UserMediaPage } from './resolvers/UserMediaPage';
    export const resolvers: Resolvers = {
      Query: { authentication: Query_authentication,dummy: Query_dummy,episode: Query_episode,episodePage: Query_episodePage,media: Query_media,mediaPage: Query_mediaPage,origin: Query_origin,originPage: Query_originPage,playbackSource: Query_playbackSource,playbackSourcePage: Query_playbackSourcePage,user: Query_user,userMediaPage: Query_userMediaPage },
      Mutation: { authenticate: Mutation_authenticate,dummy: Mutation_dummy },
      Subscription: { dummy: Subscription_dummy,mediaPage: Subscription_mediaPage },
      Authenticate: Authenticate,
AuthenticateOauth2: AuthenticateOauth2,
Authentication: Authentication,
AuthenticationMethod: AuthenticationMethod,
AuthenticationMethodHeaderValue: AuthenticationMethodHeaderValue,
CountryCode: CountryCode,
Date: Date,
Episode: Episode,
EpisodeConnection: EpisodeConnection,
EpisodeEdge: EpisodeEdge,
EpisodePage: EpisodePage,
FuzzyDate: FuzzyDate,
FuzzyDateInt: FuzzyDateInt,
Json: Json,
Media: Media,
MediaAiringSchedule: MediaAiringSchedule,
MediaAiringScheduleConnection: MediaAiringScheduleConnection,
MediaAiringScheduleEdge: MediaAiringScheduleEdge,
MediaConnection: MediaConnection,
MediaCoverImage: MediaCoverImage,
MediaEdge: MediaEdge,
MediaExternalLink: MediaExternalLink,
MediaPage: MediaPage,
MediaSynonym: MediaSynonym,
MediaTitle: MediaTitle,
MediaTrailer: MediaTrailer,
Origin: Origin,
PlaybackSource: PlaybackSource,
PlaybackSourceConnection: PlaybackSourceConnection,
PlaybackSourceEdge: PlaybackSourceEdge,
PlaybackSourcePage: PlaybackSourcePage,
Resource: Resource,
ResourceConnection: ResourceConnection,
ResourceEdge: ResourceEdge,
Team: Team,
Uri: Uri,
User: User,
UserMedia: UserMedia,
UserMediaEpisode: UserMediaEpisode,
UserMediaPage: UserMediaPage
    }