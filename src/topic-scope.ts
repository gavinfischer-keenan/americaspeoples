import {END_YEAR} from './time';

/** User-approved exception; a topic endpoint never changes the shared atlas. */
export function topicEndYear(topicId:string):number {
 return topicId==='hawaii-statehood'?1959:END_YEAR;
}

/** Exact reviewed records, not a prefix allowing arbitrary later dates. */
export const extendedTopicOnlyIds=new Set([
 'topic-hawaii-martial-law-1941',
 'topic-hawaii-martial-law-ends-1944',
 'topic-hawaii-statehood-vote-1959',
 'topic-hawaii-admission-1959',
]);
export function recordEndYear(recordId:string):number {
 return extendedTopicOnlyIds.has(recordId)?topicEndYear('hawaii-statehood'):END_YEAR;
}
