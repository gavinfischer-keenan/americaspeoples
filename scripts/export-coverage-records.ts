import {dataset} from '../src/published-data';
import {topicOnlyIds} from '../src/topic-dives';

// Use exactly the records eligible for the shared map, independent of filenames.
process.stdout.write(JSON.stringify({version:dataset.version,records:dataset.records.filter(r=>!topicOnlyIds.has(r.id))}));
