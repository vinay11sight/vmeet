import _ from 'lodash';

const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'origin': 'x-requested-with'
};

const _request = (path, method = 'GET', options = {}) => {
    const unifiedHeaders = _.merge(DEFAULT_HEADERS, options.headers);
    const fileUploading = options.fileUploading ? options.fileUploading : false;
    const headers = new Headers();

    if (!fileUploading) {
        for (const [ key, value ] of Object.entries(unifiedHeaders)) {
            headers.append(key, value);
        }
    }

    const url = new URL(path);
    const params = {
        method,
        headers,
        body: options.body ? (fileUploading ? options.body : JSON.stringify(options.body)) : undefined
    };

    if (options.queryParams) {
        url.search = new URLSearchParams(options.queryParams).toString();
    }

    return fetch(url, params);
};


export const getRoom = async (baseUrl, orgSlug, roomSlug) => await _request(baseUrl + '/api/room/check', 'GET', {
    queryParams: _.omitBy({
        organisation: orgSlug,
        room_name: roomSlug
    }, _.isNil)
});

export const getConferenceOptions = async (baseUrl, room_id) => await _request(baseUrl + '/api/room/get_conference_options', 'GET', {
    queryParams: _.omitBy({
        room_id: room_id,
    }, _.isNil)
});

export const checkMeetingIsStarted = async (baseUrl, orgSlug, roomSlug) => await _request(baseUrl + '/room', 'GET', {
    queryParams: _.omitBy({
        org_slug: orgSlug,
        room_slug: roomSlug
    }, _.isNil)
});



