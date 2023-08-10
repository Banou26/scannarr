/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
    import type   { Resolvers } from './types.generated';
    import    { CountryCode } from './resolvers/CountryCode';
import    { Date } from './resolvers/Date';
import    { Episode } from './resolvers/Episode';
import    { EpisodeConnection } from './resolvers/EpisodeConnection';
import    { EpisodeEdge } from './resolvers/EpisodeEdge';
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
import    { MediaSynonym } from './resolvers/MediaSynonym';
import    { MediaTitle } from './resolvers/MediaTitle';
import    { MediaTrailer } from './resolvers/MediaTrailer';
import    { dummy as Mutation_dummy } from './resolvers/Mutation/dummy';
import    { Origin } from './resolvers/Origin';
import    { Page } from './resolvers/Page';
import    { PageInfo } from './resolvers/PageInfo';
import    { PlaybackSource } from './resolvers/PlaybackSource';
import    { PlaybackSourceConnection } from './resolvers/PlaybackSourceConnection';
import    { PlaybackSourceEdge } from './resolvers/PlaybackSourceEdge';
import    { Episode as Query_Episode } from './resolvers/Query/Episode';
import    { Media as Query_Media } from './resolvers/Query/Media';
import    { Origin as Query_Origin } from './resolvers/Query/Origin';
import    { Page as Query_Page } from './resolvers/Query/Page';
import    { PlaybackSource as Query_PlaybackSource } from './resolvers/Query/PlaybackSource';
import    { dummy as Query_dummy } from './resolvers/Query/dummy';
import    { Resource } from './resolvers/Resource';
import    { ResourceConnection } from './resolvers/ResourceConnection';
import    { ResourceEdge } from './resolvers/ResourceEdge';
import    { Team } from './resolvers/Team';
import    { Uri } from './resolvers/Uri';
    export const resolvers: Resolvers = {
      Query: { Episode: Query_Episode,Media: Query_Media,Origin: Query_Origin,Page: Query_Page,PlaybackSource: Query_PlaybackSource,dummy: Query_dummy },
      Mutation: { dummy: Mutation_dummy },
      
      CountryCode: CountryCode,
Date: Date,
Episode: Episode,
EpisodeConnection: EpisodeConnection,
EpisodeEdge: EpisodeEdge,
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
MediaSynonym: MediaSynonym,
MediaTitle: MediaTitle,
MediaTrailer: MediaTrailer,
Origin: Origin,
Page: Page,
PageInfo: PageInfo,
PlaybackSource: PlaybackSource,
PlaybackSourceConnection: PlaybackSourceConnection,
PlaybackSourceEdge: PlaybackSourceEdge,
Resource: Resource,
ResourceConnection: ResourceConnection,
ResourceEdge: ResourceEdge,
Team: Team,
Uri: Uri
    }