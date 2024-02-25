/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
    import type   { Resolvers } from './types.generated';
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
import    { dummy as Mutation_dummy } from './resolvers/Mutation/dummy';
import    { originAuthenticate as Mutation_originAuthenticate } from './resolvers/Mutation/originAuthenticate';
import    { Origin } from './resolvers/Origin';
import    { OriginAuthenticate } from './resolvers/OriginAuthenticate';
import    { OriginAuthenticateOauth2 } from './resolvers/OriginAuthenticateOauth2';
import    { OriginAuthentication } from './resolvers/OriginAuthentication';
import    { OriginAuthenticationMethod } from './resolvers/OriginAuthenticationMethod';
import    { OriginAuthenticationMethodHeaderValue } from './resolvers/OriginAuthenticationMethodHeaderValue';
import    { OriginUser } from './resolvers/OriginUser';
import    { OriginUserMediaPage } from './resolvers/OriginUserMediaPage';
import    { PlaybackSource } from './resolvers/PlaybackSource';
import    { PlaybackSourceConnection } from './resolvers/PlaybackSourceConnection';
import    { PlaybackSourceEdge } from './resolvers/PlaybackSourceEdge';
import    { PlaybackSourcePage } from './resolvers/PlaybackSourcePage';
import    { dummy as Query_dummy } from './resolvers/Query/dummy';
import    { episode as Query_episode } from './resolvers/Query/episode';
import    { episodePage as Query_episodePage } from './resolvers/Query/episodePage';
import    { media as Query_media } from './resolvers/Query/media';
import    { mediaPage as Query_mediaPage } from './resolvers/Query/mediaPage';
import    { origin as Query_origin } from './resolvers/Query/origin';
import    { originAuthentication as Query_originAuthentication } from './resolvers/Query/originAuthentication';
import    { originPage as Query_originPage } from './resolvers/Query/originPage';
import    { originUser as Query_originUser } from './resolvers/Query/originUser';
import    { originUserMediaPage as Query_originUserMediaPage } from './resolvers/Query/originUserMediaPage';
import    { playbackSource as Query_playbackSource } from './resolvers/Query/playbackSource';
import    { playbackSourcePage as Query_playbackSourcePage } from './resolvers/Query/playbackSourcePage';
import    { Resource } from './resolvers/Resource';
import    { ResourceConnection } from './resolvers/ResourceConnection';
import    { ResourceEdge } from './resolvers/ResourceEdge';
import    { Team } from './resolvers/Team';
import    { Uri } from './resolvers/Uri';
    export const resolvers: Resolvers = {
      Query: { dummy: Query_dummy,episode: Query_episode,episodePage: Query_episodePage,media: Query_media,mediaPage: Query_mediaPage,origin: Query_origin,originAuthentication: Query_originAuthentication,originPage: Query_originPage,originUser: Query_originUser,originUserMediaPage: Query_originUserMediaPage,playbackSource: Query_playbackSource,playbackSourcePage: Query_playbackSourcePage },
      Mutation: { dummy: Mutation_dummy,originAuthenticate: Mutation_originAuthenticate },
      
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
OriginAuthenticate: OriginAuthenticate,
OriginAuthenticateOauth2: OriginAuthenticateOauth2,
OriginAuthentication: OriginAuthentication,
OriginAuthenticationMethod: OriginAuthenticationMethod,
OriginAuthenticationMethodHeaderValue: OriginAuthenticationMethodHeaderValue,
OriginUser: OriginUser,
OriginUserMediaPage: OriginUserMediaPage,
PlaybackSource: PlaybackSource,
PlaybackSourceConnection: PlaybackSourceConnection,
PlaybackSourceEdge: PlaybackSourceEdge,
PlaybackSourcePage: PlaybackSourcePage,
Resource: Resource,
ResourceConnection: ResourceConnection,
ResourceEdge: ResourceEdge,
Team: Team,
Uri: Uri
    }