import { useCallback } from 'react'
import { useActiveWeb3React } from '..'
import {
  ChallengeActionType,
  ClaimedTokens,
  InformationBar,
} from '../../constants'
import { GlobalStateInterface, useGlobalState } from '../../state/global'

export function useIsDarkMode() {
  const { state, setState } = useGlobalState()

  const toggleDarkMode = useCallback(() => {
    setState((current) => ({
      ...current,
      isDarkMode: !current.isDarkMode,
    }))
  }, [setState])

  const isDarkMode = state.isDarkMode
  return { isDarkMode, toggleDarkMode }
}

const informationBarReduceAction = (
  current: Partial<GlobalStateInterface>,
  info: InformationBar,
) => {
  const action = info.action
  const result = { ...info }
  const currentState = current.informationBar
  if (action) {
    switch (action.type) {
      case ChallengeActionType.ADD_CHALLENGE:
        result.message = 'Adding Challenge'
        result.isOpen = true
        result.isSpinning = true
        break
      case ChallengeActionType.SUPPORT_CHALLEGE:
        result.message = 'Supporting Challenge'
        result.isOpen = true
        result.isSpinning = true
        break
      case ChallengeActionType.VOTE_ON_CHALLENGE:
        result.message = 'Voting on Challenge'
        result.isOpen = true
        result.isSpinning = true
        break
      case ChallengeActionType.OWNER_REPORT_CHALLENGE:
        result.message = 'Report Submition'
        result.isOpen = true
        result.isSpinning = true
        break
      case ChallengeActionType.CONFIRM_ADD_CHALLENGE:
        if (
          currentState?.action?.id === info?.action?.id &&
          currentState?.action?.type === ChallengeActionType.ADD_CHALLENGE
        ) {
          result.message = 'Adding Challenge, Confirmed.'
          result.isOpen = true
          result.isSuccessColor = true
          result.closeOnTimeout = 3000
        }
        break
      case ChallengeActionType.CONFIRM_SUPPORT_CHALLENGE:
        if (
          currentState?.action?.id === info?.action?.id &&
          currentState?.action?.type === ChallengeActionType.SUPPORT_CHALLEGE
        ) {
          result.message = 'Supporting Challenge, Confirmed.'
          result.isOpen = true
          result.isSuccessColor = true
          result.closeOnTimeout = 3000
        }
        break
      case ChallengeActionType.CONFIRM_VOTE_ON_CHALLENGE:
        if (
          currentState?.action?.id === info?.action?.id &&
          currentState?.action?.type === ChallengeActionType.VOTE_ON_CHALLENGE
        ) {
          result.message = 'Voting on Challenge, Confirmed.'
          result.isOpen = true
          result.isSuccessColor = true
          result.closeOnTimeout = 3000
        }
        break
      case ChallengeActionType.CONFIRM_OWNER_REPORT_CHALLENGE:
        if (
          currentState?.action?.id === info?.action?.id &&
          currentState?.action?.type ===
            ChallengeActionType.OWNER_REPORT_CHALLENGE
        ) {
          result.message = 'Report Submition, Confirmed.'
          result.isOpen = true
          result.isSuccessColor = true
          result.closeOnTimeout = 3000
        }
        break

      default:
        break
    }
  }
  return result
}

export function useInformationBar() {
  const { state, setState } = useGlobalState()

  const setInformationBar = useCallback(
    (info: InformationBar) => {
      setState((current) => {
        return {
          ...current,
          informationBar: informationBarReduceAction(current, info),
        }
      })
    },
    [setState],
  )

  const dispatchInformationBar = useCallback(
    (id: string, type: ChallengeActionType) => {
      setInformationBar({
        message: '',
        isOpen: false,
        action: {
          id,
          type,
        },
      })
    },
    [setInformationBar],
  )

  const informationBar = state.informationBar
  return { informationBar, dispatchInformationBar, setInformationBar }
}

export function useTimeInSecondsTicker() {
  const { state, setState } = useGlobalState()

  const setTimeInSeconds = useCallback(
    (timestamp: number) => {
      setState((current) => ({
        ...current,
        timeInSeconds: timestamp,
      }))
    },
    [setState],
  )

  const timeInSeconds = state.timeInSeconds
  return { timeInSeconds, setTimeInSeconds }
}

export function useBlockTimestamp() {
  const { state, setState } = useGlobalState()

  const setBlockTimestamp = useCallback(
    (timestamp: number) => {
      setState((current) => ({
        ...current,
        blockTimestamp: timestamp,
      }))
    },
    [setState],
  )

  const blockTimestamp = state.blockTimestamp
  return { blockTimestamp, setBlockTimestamp }
}

export function useClaimedTokens() {
  const { state, setState } = useGlobalState()
  const { account, chainId } = useActiveWeb3React()

  const areClaimedTokens = useCallback(
    (challengeId: string) => {
      return (
        state?.claimedTokens &&
        state.claimedTokens[`${challengeId}${account}${chainId}`]
      )
    },
    [state.claimedTokens, account, chainId],
  )

  const markClaimedTokens = useCallback(
    (challengeId: string) => {
      const claimed: ClaimedTokens = {
        [`${challengeId}${account}${chainId}`]: true,
      }
      setState((current) => ({
        ...current,
        claimedTokens: { ...current.claimedTokens, ...claimed },
      }))
    },
    [setState, account, chainId],
  )

  const setClaimedTokens = useCallback(
    (claimed: ClaimedTokens) => {
      setState((current) => ({
        ...current,
        claimedTokens: { ...current.claimedTokens, ...claimed },
      }))
    },
    [setState],
  )

  const claimedTokens = state.claimedTokens
  return {
    claimedTokens,
    markClaimedTokens,
    areClaimedTokens,
    setClaimedTokens,
  }
}

export function useChallengesByFilter() {
  const { state, setState } = useGlobalState()

  const setChallengesByFilter = useCallback(
    (
      allChallenges,
      ongoingChallenges,
      supportedChallenges,
      challengesToSupport,
    ) => {
      setState((current) => ({
        ...current,
        allChallenges,
        ongoingChallenges,
        supportedChallenges,
        challengesToSupport,
      }))
    },
    [setState],
  )

  const allChallenges = state.allChallenges
  const ongoingChallenges = state.ongoingChallenges
  const supportedChallenges = state.supportedChallenges
  const challengesToSupport = state.challengesToSupport
  return {
    allChallenges,
    ongoingChallenges,
    supportedChallenges,
    challengesToSupport,
    setChallengesByFilter,
  }
}
