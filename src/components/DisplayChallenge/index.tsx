import { useState, useMemo, useEffect, useCallback } from 'react'
import { formatEther } from '@ethersproject/units'
import { ChevronDown, ChevronUp, Coffee, Flag, Anchor } from 'react-feather'
import { Challenge, ChallengeResult } from '../../constants'
import { TYPE } from '../../theme'
import {
  ChallengeContainer,
  ChallengeCard,
  ChallengeHeader,
  ChallengeLine,
  ChallengeEndLine,
  ChallengeButton,
  BorderLine,
  DetailButton,
  LightColor,
  PinkColor,
  Spacing,
  ChallengeButtonContainer,
} from './styles'
import ChallengeDetails from './ChallengeDetails'
import SupportChallenge from '../SupportChallenge'
import VoteOnChallenge from '../VoteOnChallenge'
import { oneDayInSeconds, secondsToHm } from '../../utils'
import { useBlockTimestamp } from '../../hooks/User'
import { useInformationBar } from '../../hooks/User'

enum ButtonOptionsEnum {
  InitialState,
  challengeOnGoing,
  challengeOverApproaching,
  submitReport,
  challengeDone,
  supportChallenge,
  castYourVote,
  waitingForOwner,
  waitingForSupporters,
}

export default function DisplayChallenge({
  challenge,
  account,
}: {
  challenge: Challenge
  account: string | undefined | null
}) {
  const [details, setDetails] = useState(false)
  const [reportingTimeLeft, setReportingTimeLeft] = useState('')
  const [modalStatus, setModalStatus] = useState({
    isOpen: false,
    actionDone: false,
  })
  const [buttonOption, setButtonOption] = useState(
    ButtonOptionsEnum.InitialState,
  )
  const { blockTimestamp } = useBlockTimestamp()
  const { informationBar } = useInformationBar()
  const timestamp = (challenge.deadline?.toNumber() || 1) * 1000
  const deadline = useMemo(() => new Date(timestamp).toDateString(), [
    timestamp,
  ])
  const amount = useMemo(() => formatEther(challenge.amountStaked ?? 0), [
    challenge.amountStaked,
  ])
  const supportedAmount = useMemo(
    () =>
      (account &&
        formatEther(challenge.supporters?.[account]?.amountStaked ?? 0)) ||
      '0.0',
    [account, challenge.supporters],
  )

  const isSupporting = supportedAmount !== '0.0'

  const toggleDetails = () => {
    setDetails((d) => !d)
  }

  const handleClick = () => {
    setModalStatus({ isOpen: true, actionDone: false })
  }

  const getButtonText = () => {
    switch (buttonOption) {
      case ButtonOptionsEnum.challengeOnGoing:
        return 'Challenge in progress'
      case ButtonOptionsEnum.challengeOverApproaching:
        return 'Challenge ends soon'
      case ButtonOptionsEnum.submitReport:
        return 'Submit Report'
      case ButtonOptionsEnum.supportChallenge:
        return 'Support Challenge'
      case ButtonOptionsEnum.castYourVote:
        return 'Cast Your Vote'
      case ButtonOptionsEnum.waitingForOwner:
        return 'Waiting on challenger report'
      case ButtonOptionsEnum.waitingForSupporters:
        return 'Waiting on supporters to finish voting'
      case ButtonOptionsEnum.challengeDone:
        return 'Challenge is Over'

      default:
        return ButtonOptionsEnum.InitialState
    }
  }

  const calcTimeLeftForReportingAndVoting = useCallback(() => {
    const deadline = challenge.deadline?.toNumber()
    if (!(blockTimestamp && deadline)) return
    const ownerReportingDeadline = deadline + oneDayInSeconds * 2
    const supporterVotingDeadline = deadline + oneDayInSeconds * 7
    const ownerTimeLeft = ownerReportingDeadline - blockTimestamp
    const supporterTimeLeft = supporterVotingDeadline - blockTimestamp
    const timeleft =
      buttonOption === ButtonOptionsEnum.waitingForSupporters ||
      buttonOption === ButtonOptionsEnum.castYourVote
        ? supporterTimeLeft
        : ownerTimeLeft
    const days = Math.floor(timeleft / oneDayInSeconds)
    let result
    if (days > 1) {
      result = `${days} days`
    } else if (timeleft > 0) {
      result = secondsToHm(timeleft)
    } else {
      result = ''
    }
    setReportingTimeLeft(result)
  }, [blockTimestamp, buttonOption, challenge.deadline])

  useEffect(() => {
    const twoDays = 2 * oneDayInSeconds
    const sevenDays = 7 * oneDayInSeconds
    const deadline = challenge?.deadline?.toNumber()
    if (!challenge || !account || !deadline || !blockTimestamp) return
    const ownerTimeLeftToVote = deadline + twoDays - blockTimestamp
    const supporterTimeLeftToVote = deadline + sevenDays - blockTimestamp
    const ownerResult = challenge.ownerResult ?? ChallengeResult.Initial
    if (challenge.owner === account) {
      if (ownerTimeLeftToVote > 0 && ownerTimeLeftToVote < twoDays) {
        if (ownerResult === ChallengeResult.Success) {
          // TODO: owner reported on success. indication for him to wait untill the 7 days are over
          setButtonOption(ButtonOptionsEnum.waitingForSupporters)
        } else if (ownerResult === ChallengeResult.Failure) {
          // TODO: Challenge is over. owner is a looser
          setButtonOption(ButtonOptionsEnum.challengeDone)
        } else {
          setButtonOption(ButtonOptionsEnum.submitReport)
        }
      } else if (ownerTimeLeftToVote <= 0) {
        setButtonOption(ButtonOptionsEnum.challengeDone)
      } else if (ownerTimeLeftToVote > twoDays) {
        if (deadline > blockTimestamp + oneDayInSeconds) {
          setButtonOption(ButtonOptionsEnum.challengeOnGoing)
        } else {
          setButtonOption(ButtonOptionsEnum.challengeOverApproaching)
        }
      }
    } else if (
      challenge.supporters &&
      challenge.supporters[account]?.supporter === account
    ) {
      if (supporterTimeLeftToVote > 0 && supporterTimeLeftToVote < sevenDays) {
        // Check if owner reported on success within the 2 days period
        // if yes, 'castYourVote' if No:
        // if owner reported false - challenge is over no need to vote
        // if owner didnt report and 2 days period is done - challenge is over no need to vote
        if (ownerResult === ChallengeResult.Success) {
          if (
            challenge.supportersResult &&
            challenge.supportersResult[account] &&
            (challenge.supportersResult[account]?.result ===
              ChallengeResult.Success ||
              challenge.supportersResult[account]?.result ===
                ChallengeResult.Failure)
          ) {
            setButtonOption(ButtonOptionsEnum.waitingForSupporters)
          } else {
            setButtonOption(ButtonOptionsEnum.castYourVote)
          }
        } else if (ownerResult === ChallengeResult.Failure) {
          // TODO: Challenge is over. collect your initial support and rewards
          setButtonOption(ButtonOptionsEnum.challengeDone)
        } else if (
          supporterTimeLeftToVote > 0 &&
          supporterTimeLeftToVote > sevenDays - twoDays
        ) {
          // TODO: Owner did not reported yet... waiting untill 2 days are done
          setButtonOption(ButtonOptionsEnum.waitingForOwner)
        }
      } else if (supporterTimeLeftToVote <= 0) {
        setButtonOption(ButtonOptionsEnum.challengeDone)
      } else if (ownerTimeLeftToVote > twoDays) {
        if (deadline > blockTimestamp + oneDayInSeconds) {
          setButtonOption(ButtonOptionsEnum.challengeOnGoing)
        } else {
          setButtonOption(ButtonOptionsEnum.challengeOverApproaching)
        }
      }
    } else if (deadline <= blockTimestamp) {
      setButtonOption(ButtonOptionsEnum.challengeDone)
    } else {
      setButtonOption(ButtonOptionsEnum.supportChallenge)
    }
    calcTimeLeftForReportingAndVoting()
  }, [
    challenge,
    challenge.owner,
    challenge.deadline,
    challenge.supporters,
    challenge.ownerResult,
    account,
    blockTimestamp,
    calcTimeLeftForReportingAndVoting,
  ])

  useEffect(() => {
    if (informationBar && !informationBar.isOpen) {
      setModalStatus((current) => {
        return { isOpen: current.isOpen, actionDone: false }
      })
    }
  }, [informationBar, setModalStatus])

  return (
    <>
      <ChallengeContainer>
        <ChallengeCard>
          <ChallengeHeader>
            {isSupporting ? (
              <TYPE.Yellow>
                <Flag style={{ paddingTop: '2px', marginInlineEnd: '10px' }} />
              </TYPE.Yellow>
            ) : challenge.owner === account ? (
              <TYPE.Green>
                <Anchor
                  style={{ paddingTop: '2px', marginInlineEnd: '10px' }}
                />
              </TYPE.Green>
            ) : (
              <TYPE.Yellow>
                <Coffee
                  style={{ paddingTop: '2px', marginInlineEnd: '10px' }}
                />
              </TYPE.Yellow>
            )}
            <TYPE.LargeHeader>{challenge.name}</TYPE.LargeHeader>
          </ChallengeHeader>
          <Spacing />

          {buttonOption !== ButtonOptionsEnum.InitialState &&
            ((buttonOption === ButtonOptionsEnum.waitingForOwner ||
              buttonOption === ButtonOptionsEnum.waitingForSupporters) &&
            reportingTimeLeft !== '' ? (
              <>
                <ChallengeLine>
                  <TYPE.Yellow>
                    {buttonOption === ButtonOptionsEnum.waitingForOwner
                      ? 'Waiting on challenger report...'
                      : 'Waiting on all supporters votes...'}
                  </TYPE.Yellow>
                </ChallengeLine>
                <ChallengeLine>
                  <LightColor>
                    {buttonOption === ButtonOptionsEnum.waitingForOwner
                      ? 'Reporting time remaining'
                      : 'Voting time remaining'}
                  </LightColor>
                  <PinkColor> {reportingTimeLeft}</PinkColor>
                </ChallengeLine>
              </>
            ) : buttonOption === ButtonOptionsEnum.challengeDone ||
              buttonOption === ButtonOptionsEnum.challengeOnGoing ||
              buttonOption === ButtonOptionsEnum.challengeOverApproaching ? (
              buttonOption === ButtonOptionsEnum.challengeOverApproaching ? (
                <TYPE.Yellow>{getButtonText()}</TYPE.Yellow>
              ) : (
                <TYPE.Green>{getButtonText()}</TYPE.Green>
              )
            ) : (
              <>
                <ChallengeButtonContainer>
                  <TYPE.MediumHeader>
                    <ChallengeButton
                      disabled={modalStatus?.actionDone}
                      onClick={handleClick}
                    >
                      {modalStatus?.actionDone ? 'Pending' : getButtonText()}
                    </ChallengeButton>
                  </TYPE.MediumHeader>
                </ChallengeButtonContainer>
                {buttonOption === ButtonOptionsEnum.submitReport ||
                buttonOption === ButtonOptionsEnum.castYourVote ? (
                  <ChallengeLine>
                    <LightColor>
                      {buttonOption === ButtonOptionsEnum.submitReport
                        ? 'Reporting time remaining'
                        : 'Voting time remaining'}
                    </LightColor>
                    <PinkColor> {reportingTimeLeft}</PinkColor>
                  </ChallengeLine>
                ) : null}
              </>
            ))}
          <Spacing />
          <ChallengeLine>
            <LightColor>Deadline</LightColor>
            {deadline}
          </ChallengeLine>
          <ChallengeLine>
            <LightColor>Challenge Stake</LightColor>
            <ChallengeEndLine>
              <PinkColor>{amount}</PinkColor>
            </ChallengeEndLine>
          </ChallengeLine>
          {isSupporting && (
            <ChallengeLine>
              <LightColor>Your Stake</LightColor>
              <ChallengeEndLine>
                <PinkColor>{supportedAmount}</PinkColor>
              </ChallengeEndLine>
            </ChallengeLine>
          )}
          <BorderLine />
          <ChallengeLine>
            <PinkColor></PinkColor>
            <LightColor>
              <DetailButton onClick={toggleDetails}>
                {details ? 'Hide' : 'Details'}{' '}
                {details ? <ChevronUp /> : <ChevronDown />}
              </DetailButton>
            </LightColor>
          </ChallengeLine>
          {details ? <ChallengeDetails challenge={challenge} /> : null}
        </ChallengeCard>
      </ChallengeContainer>

      {buttonOption === ButtonOptionsEnum.supportChallenge && (
        <SupportChallenge
          challenge={challenge}
          isOpenModal={modalStatus?.isOpen}
          setModalStatus={setModalStatus}
        />
      )}
      {(buttonOption === ButtonOptionsEnum.castYourVote ||
        buttonOption === ButtonOptionsEnum.submitReport) && (
        <VoteOnChallenge
          challenge={challenge}
          isOwner={challenge.owner === account}
          isOpenModal={modalStatus?.isOpen}
          setModalStatus={setModalStatus}
        />
      )}
    </>
  )
}
