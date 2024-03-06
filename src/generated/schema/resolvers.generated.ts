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
import    { _empty as Mutation__empty } from './resolvers/Mutation/_empty';
import    { authenticate as Mutation_authenticate } from './resolvers/Mutation/authenticate';
import    { Origin } from './resolvers/Origin';
import    { PlaybackSource } from './resolvers/PlaybackSource';
import    { PlaybackSourceConnection } from './resolvers/PlaybackSourceConnection';
import    { PlaybackSourceEdge } from './resolvers/PlaybackSourceEdge';
import    { PlaybackSourcePage } from './resolvers/PlaybackSourcePage';
import    { _empty as Query__empty } from './resolvers/Query/_empty';
import    { authentication as Query_authentication } from './resolvers/Query/authentication';
import    { origin as Query_origin } from './resolvers/Query/origin';
import    { originPage as Query_originPage } from './resolvers/Query/originPage';
import    { user as Query_user } from './resolvers/Query/user';
import    { Resource } from './resolvers/Resource';
import    { ResourceConnection } from './resolvers/ResourceConnection';
import    { ResourceEdge } from './resolvers/ResourceEdge';
import    { _empty as Subscription__empty } from './resolvers/Subscription/_empty';
import    { episode as Subscription_episode } from './resolvers/Subscription/episode';
import    { episodePage as Subscription_episodePage } from './resolvers/Subscription/episodePage';
import    { media as Subscription_media } from './resolvers/Subscription/media';
import    { mediaPage as Subscription_mediaPage } from './resolvers/Subscription/mediaPage';
import    { playbackSource as Subscription_playbackSource } from './resolvers/Subscription/playbackSource';
import    { playbackSourcePage as Subscription_playbackSourcePage } from './resolvers/Subscription/playbackSourcePage';
import    { userMediaPage as Subscription_userMediaPage } from './resolvers/Subscription/userMediaPage';
import    { Team } from './resolvers/Team';
import    { Uri } from './resolvers/Uri';
import    { User } from './resolvers/User';
import    { UserMedia } from './resolvers/UserMedia';
import    { UserMediaEpisode } from './resolvers/UserMediaEpisode';
import    { UserMediaPage } from './resolvers/UserMediaPage';
    export const resolvers: Resolvers = {
      Query: { _empty: Query__empty,authentication: Query_authentication,origin: Query_origin,originPage: Query_originPage,user: Query_user },
      Mutation: { _empty: Mutation__empty,authenticate: Mutation_authenticate },
      Subscription: { _empty: Subscription__empty,episode: Subscription_episode,episodePage: Subscription_episodePage,media: Subscription_media,mediaPage: Subscription_mediaPage,playbackSource: Subscription_playbackSource,playbackSourcePage: Subscription_playbackSourcePage,userMediaPage: Subscription_userMediaPage },
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