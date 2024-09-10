import React, {useEffect} from 'react';
import getConfig from 'next/config';

import {useMemberInformationState} from '../../../../common/hooks/useMemberInformationState';
import {useTypedSelector} from '../../../../common/hooks';
import {TelephonyStatus} from '../../../../common/components/TelephoneStatusIcon/TelephonyStatus';

const {proxyServerBaseUrl} = getConfig().publicRuntimeConfig;

export function useSmartNotesAPI() {
  const {memberInformation} = useMemberInformationState();
  const {telephonyStatus} = useTypedSelector((state) => state.telephonyState);
  const [smartNotes, setSmartNotes] = React.useState<string>('test');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isError, setIsError] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [currentStatus, setCurrentStatus] = React.useState<string>('Disconnected');
  const UCID = memberInformation.ucid || 123;

  useEffect(() => {
    if (telephonyStatus === TelephonyStatus.Connected) {
      setCurrentStatus('Connected');
      if (isLoading) {
        setIsLoading(false);
        const eventSource = new EventSource(
          `${proxyServerBaseUrl}/contactSummaryStream/channelName?channelName=channel-${UCID}`
        );
        eventSource.onmessage = (event) => {
          const {data} = event;
          if (data) {
            setSmartNotes(data.replace(/^"(.+(?="$))"$/, '$1'));
          }
        };

        return () => {
          eventSource.close();
        };
      }
    } else if (telephonyStatus === TelephonyStatus.ConnectedWithCall) {
      setIsLoading(true);
      setCurrentStatus('ConnectedWithCall');
    } else if (telephonyStatus === TelephonyStatus.Disconnected) {
      setCurrentStatus('Disconnected');
    } else {
      setCurrentStatus('Error');
      setError('Telephony status is not valid');
      setIsError(true);
    }
    return () => null;
  }, [telephonyStatus, UCID]);

  return {smartNotes, isLoading, isError, error, currentStatus};
}
