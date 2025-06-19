import { createRecordingEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { getCurrentConference, getRoomName } from '../base/conference/functions';
import JitsiMeetJS, {
    JitsiConferenceEvents,
    JitsiRecordingConstants
} from '../base/lib-jitsi-meet';
import { CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { MEDIA_TYPE } from '../base/media/constants';
import { PARTICIPANT_UPDATED } from '../base/participants/actionTypes';
import { updateLocalRecordingStatus } from '../base/participants/actions';
import { PARTICIPANT_ROLE } from '../base/participants/constants';
import { getLocalParticipant, getParticipantDisplayName } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import {
    playSound,
    stopSound
} from '../base/sounds/actions';
import { TRACK_ADDED, TRACK_REMOVED } from '../base/tracks/actionTypes';
import { hideNotification, showErrorNotification, showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { isRecorderTranscriptionsRunning } from '../transcribing/functions';

import { RECORDING_SESSION_UPDATED, START_LOCAL_RECORDING, STOP_LOCAL_RECORDING } from './actionTypes';
import {
    clearRecordingSessions,
    hidePendingRecordingNotification,
    showPendingRecordingNotification,
    showRecordingError,
    showRecordingLimitNotification,
    showRecordingWarning,
    showStartRecordingNotification,
    showStartedRecordingNotification,
    showStoppedRecordingNotification,
    updateRecordingSessionData
} from './actions';
import LocalRecordingManager from './components/Recording/LocalRecordingManager';
import {
    LIVE_STREAMING_OFF_SOUND_ID,
    LIVE_STREAMING_ON_SOUND_ID,
    RECORDING_OFF_SOUND_ID,
    RECORDING_ON_SOUND_ID,
    START_RECORDING_NOTIFICATION_ID
} from './constants';
import {
    getResourceId,
    getSessionById,
    registerRecordingAudioFiles,
    unregisterRecordingAudioFiles,
    getActiveSession
} from './functions';
import logger from './logger';
import * as IISightAPI from '../../helpers/api';
import { getAppProp } from '../base/app/functions';

let recorderSessionId;
let activeConference;

/**
 * StateListenerRegistry provides a reliable way to detect the leaving of a
 * conference, where we need to clean up the recording sessions.
 */
StateListenerRegistry.register(
    /* selector */ state => getCurrentConference(state),
    /* listener */(conference, { dispatch }) => {
        if (!conference) {
            dispatch(clearRecordingSessions());
        }
    }
);

/**
 * The redux middleware to handle the recorder updates in a React way.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    let oldSessionData;

    if (action.type === RECORDING_SESSION_UPDATED) {
        oldSessionData
            = getSessionById(getState(), action.sessionData.id);
    }

    const result = next(action);

    switch (action.type) {
        case APP_WILL_MOUNT:
            registerRecordingAudioFiles(dispatch);

            break;

        case APP_WILL_UNMOUNT:
            unregisterRecordingAudioFiles(dispatch);

            break;

        case CONFERENCE_JOIN_IN_PROGRESS: {
            const { conference } = action;
            activeConference = conference;

            conference.on(
                JitsiConferenceEvents.RECORDER_STATE_CHANGED,
                (recorderSession: any) => {
                    if (recorderSession) {
                        recorderSessionId = recorderSession.getID();
                        recorderSession.getID() && dispatch(updateRecordingSessionData(recorderSession));
                        recorderSession.getError() && _showRecordingErrorNotification(recorderSession, dispatch, getState);
                    }

                    return;
                });

            break;
        }

        case START_LOCAL_RECORDING: {
            logger.debug('RECSAT START_LOCAL_RECORDING: execution start');
            const { localRecording } = getState()['features/base/config'];
            const { onlySelf } = action;

            LocalRecordingManager.startLocalRecording({
                dispatch,
                getState
            }, action.onlySelf)
                .then(() => {
                    const props = {
                        descriptionKey: 'recording.on',
                        titleKey: 'dialog.recording'
                    };

                    if (localRecording?.notifyAllParticipants && !onlySelf) {
                        //dispatch(playSound(RECORDING_ON_SOUND_ID));
                    }
                    dispatch(showNotification(props, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
                    dispatch(showNotification({
                        titleKey: 'recording.localRecordingStartWarningTitle',
                        descriptionKey: 'recording.localRecordingStartWarning'
                    }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
                    dispatch(updateLocalRecordingStatus(true, onlySelf));
                    sendAnalytics(createRecordingEvent('started', `local${onlySelf ? '.self' : ''}`));
                    if (typeof APP !== 'undefined') {
                        APP.API.notifyRecordingStatusChanged(
                            true, 'local', undefined, isRecorderTranscriptionsRunning(getState()));
                    }
                })
                .catch(err => {
                    logger.debug('RECSAT START_LOCAL_RECORDING: execution exception');
                    logger.error('Capture failed', err);

                    let descriptionKey = 'recording.error';

                    if (err.message === 'WrongSurfaceSelected') {
                        descriptionKey = 'recording.surfaceError';

                    } else if (err.message === 'NoLocalStreams') {
                        descriptionKey = 'recording.noStreams';
                    } else if (err.message === 'NoMicTrack') {
                        descriptionKey = 'recording.noMicPermission';
                    }
                    const props = {
                        descriptionKey,
                        titleKey: 'recording.failedToStart'
                    };

                    if (typeof APP !== 'undefined') {
                        APP.API.notifyRecordingStatusChanged(
                            false, 'local', err.message, isRecorderTranscriptionsRunning(getState()));
                    }

                    dispatch(showErrorNotification(props, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
                });
                logger.debug('RECSAT START_LOCAL_RECORDING: execution end');
            break;
        }

        case STOP_LOCAL_RECORDING: {
            logger.debug('RECSAT STOP_LOCAL_RECORDING: execution start');
            const { localRecording } = getState()['features/base/config'];

            if (LocalRecordingManager.isRecordingLocally()) {
                LocalRecordingManager.stopLocalRecording();
                dispatch(updateLocalRecordingStatus(false));
                if (localRecording?.notifyAllParticipants && !LocalRecordingManager.selfRecording) {
                    //dispatch(playSound(RECORDING_OFF_SOUND_ID));
                }
                if (typeof APP !== 'undefined') {
                    APP.API.notifyRecordingStatusChanged(
                        false, 'local', undefined, isRecorderTranscriptionsRunning(getState()));
                }
            }
            logger.debug('RECSAT STOP_LOCAL_RECORDING: execution end');
            break;
        }

        case RECORDING_SESSION_UPDATED: {
            logger.debug('RECSAT RECORDING_SESSION_UPDATED: execution start');
            const state = getState();

            // When in recorder mode no notifications are shown
            // or extra sounds are also not desired
            // but we want to indicate those in case of sip gateway
            const {
                iAmRecorder,
                iAmSipGateway,
                recordingLimit
            } = state['features/base/config'];

            if (iAmRecorder && !iAmSipGateway) {
                break;
            }
            const activeRecordingSession = getActiveSession(getState(), JitsiRecordingConstants.mode.FILE);
            logger.debug(`RECORDING_SESSION_UPDATED: activeRecordingSession : = ${activeRecordingSession}`);
            console.debug(activeRecordingSession);

            activeConference = getCurrentConference(getState());
            logger.debug(`RECORDING_SESSION_UPDATED: activeConference : = ${activeConference}`);
            console.debug(activeConference);

            const updatedSessionData
                = getSessionById(state, action.sessionData.id);
            const { initiator, mode = '', terminator } = updatedSessionData ?? {};
            const { PENDING, OFF, ON } = JitsiRecordingConstants.status;

            if (updatedSessionData?.status === PENDING && oldSessionData?.status !== PENDING) {
                dispatch(showPendingRecordingNotification(mode));
                dispatch(hideNotification(START_RECORDING_NOTIFICATION_ID));
                break;
            }

            dispatch(hidePendingRecordingNotification(mode));

            if (updatedSessionData?.status === ON) {

                // We receive 2 updates of the session status ON. The first one is from jibri when it joins.
                // The second one is from jicofo which will deliever the initiator value. Since the start
                // recording notification uses the initiator value we skip the jibri update and show the
                // notification on the update from jicofo.
                // FIXE: simplify checks when the backend start sending only one status ON update containing the
                // initiator.
                if (initiator && !oldSessionData?.initiator) {
                    if (typeof recordingLimit === 'object') {
                        dispatch(showRecordingLimitNotification(mode));
                    } else {
                        dispatch(showStartedRecordingNotification(mode, initiator, action.sessionData.id));
                    }
                }

                if (oldSessionData?.status !== ON) {
                    sendAnalytics(createRecordingEvent('start', mode));

                    let soundID;

                    if (mode === JitsiRecordingConstants.mode.FILE && !isRecorderTranscriptionsRunning(state)) {
                        soundID = RECORDING_ON_SOUND_ID;
                    } else if (mode === JitsiRecordingConstants.mode.STREAM) {
                        soundID = LIVE_STREAMING_ON_SOUND_ID;
                    }

                    if (soundID) {
                        //dispatch(playSound(soundID));
                    }

                    if (typeof APP !== 'undefined') {
                        APP.API.notifyRecordingStatusChanged(
                            true, mode, undefined, isRecorderTranscriptionsRunning(state));
                    }
                }
            } else if (updatedSessionData?.status === OFF && oldSessionData?.status !== OFF) {
                if (terminator) {
                    dispatch(
                        showStoppedRecordingNotification(
                            mode, getParticipantDisplayName(state, getResourceId(terminator))));
                }

                let duration = 0, soundOff, soundOn;

                if (oldSessionData?.timestamp) {
                    duration
                        = (Date.now() / 1000) - oldSessionData.timestamp;
                }
                sendAnalytics(createRecordingEvent('stop', mode, duration));

                if (mode === JitsiRecordingConstants.mode.FILE && !isRecorderTranscriptionsRunning(state)) {
                    soundOff = RECORDING_OFF_SOUND_ID;
                    soundOn = RECORDING_ON_SOUND_ID;
                } else if (mode === JitsiRecordingConstants.mode.STREAM) {
                    soundOff = LIVE_STREAMING_OFF_SOUND_ID;
                    soundOn = LIVE_STREAMING_ON_SOUND_ID;
                }

                if (soundOff && soundOn) {
                    //dispatch(stopSound(soundOn));
                    //dispatch(playSound(soundOff));
                }

                if (typeof APP !== 'undefined') {
                    APP.API.notifyRecordingStatusChanged(
                        false, mode, undefined, isRecorderTranscriptionsRunning(state));
                }
            }
            logger.debug('RECSAT RECORDING_SESSION_UPDATED: execution end');
            break;
        }
        case TRACK_ADDED: {
            logger.debug('RECSAT TRACK_ADDED: execution start');
            // const { track } = action;

            // if (LocalRecordingManager.isRecordingLocally() && track.mediaType === MEDIA_TYPE.AUDIO) {
            //     const audioTrack = track.jitsiTrack.track;

            //     LocalRecordingManager.addAudioTrackToLocalRecording(audioTrack);
            // }

            setTimeout(async () => {
                logger.debug('TRACK_ADDED: executed > setTimeout()');
                const state = getState();

                //format : 'https://room-daily.11sight.com/11sight/9116c108-6587-4b08-bfb1-7c49ca7bc1c9?c=712917'
                const conferenceProp = getAppProp(state, 'url') || {};

                const tld = '.com';

                let [baseUrl,] = conferenceProp.url?.split(tld);

                baseUrl = baseUrl + tld;

                let [, , , organisation] = conferenceProp.url?.split('/');

                const roomName = getRoomName(state);

                logger.debug(`TRACK_ADDED: baseUrl, organisation, roomName   = ${baseUrl}, ${organisation}, ${roomName}`);
                const res = await IISightAPI.getRoom(baseUrl, organisation, roomName);
                const body = await res.json();
                logger.debug(`TRACK_ADDED: getRoom() response body : = ${body}`);
                console.log(body);

                const isVconnect = body?.room?.call?.id > 0
                const isRecordingEnabled = body?.room?.conference_options?.auto_recording;

                if (!body.status) {
                    logger.debug(`TRACK_ADDED: body not found`);
                    return;
                }

                if (!isVconnect) {
                    logger.debug(`TRACK_ADDED: isVconnect not found`);
                    return;
                }

                if (!isRecordingEnabled) {
                    logger.debug(`TRACK_ADDED: isRecordingEnabled is false`);
                    return;
                }

                const localParticipant = getLocalParticipant(state);
                if (localParticipant?.id == 'local') {
                    logger.debug(`TRACK_ADDED: participant_id  = ${localParticipant?.id}`);
                    return;
                }

                if (body.room?.conference_options?.remaining_recording_limit == 0) {
                    logger.debug(`TRACK_ADDED: body.room?.conference_options-> ${body.room?.conference_options} `);
                    logger.debug(`TRACK_ADDED: body.room?.conference_options?.remaining_recording_limit-> ${body.room?.conference_options?.remaining_recording_limit} `);
                    return;
                }

                const appData = JSON.stringify({
                    'file_recording_metadata': {
                        'share': true,
                        'meeting_id': body.room?.id,
                        'user_id': body.room?.user_id,
                        'participant_id': localParticipant?.id,
                        'vconnect': isVconnect,
                        'src':'mobile',
                        'call_id': body?.room?.call?.id?.toString()
                    }
                });

                console.log(appData);

                const conference = getCurrentConference(state);

                if (conference) {
                    conference.startRecording({
                        mode: JitsiRecordingConstants.mode.FILE,
                        appData
                    });
                    logger.debug(`TRACK_ADDED: startRecording() finished`);
                } else {
                    logger.error('Conference is not defined');
                }
                logger.debug('RECSAT TRACK_ADDED: execution end');
            }, 2000);


        const { track } = action;
        logger.debug('TRACK_ADDED: executed');

        if (LocalRecordingManager.isRecordingLocally() && track.mediaType === MEDIA_TYPE.AUDIO) {
            const audioTrack = track.jitsiTrack.track;

            LocalRecordingManager.addAudioTrackToLocalRecording(audioTrack);
        }

        setTimeout(async () => {
            const conference = getCurrentConference(getState());
            const appData = JSON.stringify({'file_recording_metadata': {'share': true } });
            conference.startRecording({ mode: JitsiRecordingConstants.mode.FILE, appData });
            logger.debug(`TRACK_ADDED: startRecording() finished`);
         }, 8000);


            break;
        }
        case TRACK_REMOVED: {
            logger.debug('RECSAT TRACK_REMOVED: execution start');

            setTimeout(async () => {
                if (activeConference && recorderSessionId) {
                    logger.debug(`TRACK_REMOVED: stopRecording() called with activeSession id  = ${recorderSessionId}`);
                    activeConference.stopRecording(recorderSessionId);
                    logger.debug(`TRACK_REMOVED: stopRecording() executed`);
                } else {
                    logger.error('TRACK_REMOVED: No recording or streaming session found');
                }
            }, 100);

            logger.debug('RECSAT TRACK_REMOVED: execution end');
            break;
        }
        case PARTICIPANT_UPDATED: {
            logger.debug('RECSAT PARTICIPANT_UPDATED: execution start');
            const { id, role } = action.participant;
            logger.debug(`PARTICIPANT_UPDATED: id  = ${id}`);
            const state = getState();
            const localParticipant = getLocalParticipant(state);
            logger.debug(`PARTICIPANT_UPDATED: localParticipant  = ${localParticipant}`);
            logger.debug(`PARTICIPANT_UPDATED: localParticipant id = ${localParticipant?.id}`);

            if (localParticipant?.id !== id) {
                logger.debug(`PARTICIPANT_UPDATED: Participant ids match = ${id}`);
                return next(action);
            }

            if (role === PARTICIPANT_ROLE.MODERATOR) {
                dispatch(showStartRecordingNotification());
            }
            logger.debug('RECSAT PARTICIPANT_UPDATED: execution end');
            return next(action);
        }
    }

    return result;
});

/**
 * Shows a notification about an error in the recording session. A
 * default notification will display if no error is specified in the passed
 * in recording session.
 *
 * @private
 * @param {Object} session - The recorder session model from the
 * lib.
 * @param {Dispatch} dispatch - The Redux Dispatch function.
 * @param {Function} getState - The Redux getState function.
 * @returns {void}
 */
function _showRecordingErrorNotification(session: any, dispatch: IStore['dispatch'], getState: IStore['getState']) {
    const mode = session.getMode();
    const error = session.getError();
    const isStreamMode = mode === JitsiMeetJS.constants.recording.mode.STREAM;

    switch (error) {
        case JitsiMeetJS.constants.recording.error.SERVICE_UNAVAILABLE:
            dispatch(showRecordingError({
                descriptionKey: 'recording.unavailable',
                descriptionArguments: {
                    serviceName: isStreamMode
                        ? '$t(liveStreaming.serviceName)'
                        : '$t(recording.serviceName)'
                },
                titleKey: isStreamMode
                    ? 'liveStreaming.unavailableTitle'
                    : 'recording.unavailableTitle'
            }));
            break;
        case JitsiMeetJS.constants.recording.error.RESOURCE_CONSTRAINT:
            dispatch(showRecordingError({
                descriptionKey: isStreamMode
                    ? 'liveStreaming.busy'
                    : 'recording.busy',
                titleKey: isStreamMode
                    ? 'liveStreaming.busyTitle'
                    : 'recording.busyTitle'
            }));
            break;
        case JitsiMeetJS.constants.recording.error.UNEXPECTED_REQUEST:
            // dispatch(showRecordingWarning({
            //     descriptionKey: isStreamMode
            //         ? 'liveStreaming.sessionAlreadyActive'
            //         : 'recording.sessionAlreadyActive',
            //     titleKey: isStreamMode ? 'liveStreaming.inProgress' : 'recording.inProgress'
            // }));
            break;
        default:
            // dispatch(showRecordingError({
            //     descriptionKey: isStreamMode
            //         ? 'liveStreaming.error'
            //         : 'recording.error',
            //     titleKey: isStreamMode
            //         ? 'liveStreaming.failedToStart'
            //         : 'recording.failedToStart'
            // }));
            break;
    }

    if (typeof APP !== 'undefined') {
        APP.API.notifyRecordingStatusChanged(false, mode, error, isRecorderTranscriptionsRunning(getState()));
    }
}
