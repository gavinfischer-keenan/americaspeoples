/**
 * Story and topic content that is pure data lives in data/stories/*.json and
 * data/topics/*.json, named by subject. This module is the single typed entry
 * point for it; the validators in stories.ts / topic-dives.ts check the shape.
 */
import type {Story} from './stories';
import type {TopicDive} from './topic-dives';
import ancestralPuebloAndMajorSites from '../data/stories/ancestral-pueblo-and-major-sites.json';
import andesAndMesoamericaCities from '../data/stories/andes-and-mesoamerica-cities.json';
import earthworksAmazoniaAndOceania from '../data/stories/earthworks-amazonia-and-oceania.json';
import islandSoutheastAsia from '../data/stories/island-southeast-asia.json';
import micronesia from '../data/stories/micronesia.json';
import raiStoneMoney from '../data/topics/rai-stone-money.json';
import austronesianAndAustralianIndustries from '../data/topics/austronesian-languages-and-australian-industries.json';
import indigenousAmericanLanguages from '../data/topics/indigenous-american-languages.json';

const stories = (file: {stories: unknown}) => file.stories as Story[];
const topics = (file: {topics: unknown; topicOnlyIds: string[]}) => ({topics: file.topics as TopicDive[], onlyIds: file.topicOnlyIds});

export const ancestralPuebloAndMajorSiteStories = stories(ancestralPuebloAndMajorSites);
export const andesAndMesoamericaCityStories = stories(andesAndMesoamericaCities);
export const earthworksAmazoniaAndOceaniaStories = stories(earthworksAmazoniaAndOceania);
export const islandSoutheastAsiaStories = stories(islandSoutheastAsia);
export const micronesiaStories = stories(micronesia);

export const raiStoneMoneyTopics = topics(raiStoneMoney);
export const austronesianAndAustralianIndustryTopics = topics(austronesianAndAustralianIndustries);
export const indigenousAmericanLanguageTopics = topics(indigenousAmericanLanguages);
