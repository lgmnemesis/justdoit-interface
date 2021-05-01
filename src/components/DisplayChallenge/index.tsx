import { useState, useMemo, useEffect } from 'react'
import { formatEther } from '@ethersproject/units'
import { ChevronDown, ChevronUp, Coffee, Flag, Anchor } from 'react-feather'
import { Challenge } from '../../constants'
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
import { oneDayInSeconds } from '../../utils'
import { useTimeInSecondsTicker } from '../../hooks/User'

enum ButtonOptionsEnum {
  challengeOnGoing,
  challengeOverApproaching,
  submitReport,
  challengeDone,
  supportChallenge,
  castYourVote,
}

export default function DisplayChallenge({
  challenge,
  account,
}: {
  challenge: Challenge
  account: string | undefined | null
}) {
  const [details, setDetails] = useState(false)
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [buttonOption, setButtonOption] = useState(
    ButtonOptionsEnum.supportChallenge,
  )
  const { timeInSeconds } = useTimeInSecondsTicker()
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
    setIsOpenModal(true)
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
      case ButtonOptionsEnum.challengeDone:
        return 'Challenge is Over'

      default:
        return ''
    }
  }

  useEffect(() => {
    const twoDays = 2 * oneDayInSeconds
    const sevenDays = 7 * oneDayInSeconds
    const deadline = challenge.deadline?.toNumber()
    if (!deadline || !timeInSeconds) return
    const ownerTimeLeftToVote = deadline + twoDays - timeInSeconds
    const supporterTimeLeftToVote = deadline + sevenDays - timeInSeconds
    if (challenge.owner === account) {
      if (ownerTimeLeftToVote > 0 && ownerTimeLeftToVote < twoDays) {
        setButtonOption(ButtonOptionsEnum.submitReport)
      } else if (ownerTimeLeftToVote <= 0) {
        setButtonOption(ButtonOptionsEnum.challengeDone)
      } else if (ownerTimeLeftToVote > twoDays) {
        if (deadline > timeInSeconds + oneDayInSeconds) {
          setButtonOption(ButtonOptionsEnum.challengeOnGoing)
        } else {
          setButtonOption(ButtonOptionsEnum.challengeOverApproaching)
        }
      }
    } else if (
      account &&
      challenge?.supporters &&
      challenge.supporters[account]?.supporter === account
    ) {
      if (supporterTimeLeftToVote > 0 && supporterTimeLeftToVote < sevenDays) {
        setButtonOption(ButtonOptionsEnum.castYourVote)
      } else if (supporterTimeLeftToVote <= 0) {
        setButtonOption(ButtonOptionsEnum.challengeDone)
      } else if (ownerTimeLeftToVote > twoDays) {
        if (deadline > timeInSeconds + oneDayInSeconds) {
          setButtonOption(ButtonOptionsEnum.challengeOnGoing)
        } else {
          setButtonOption(ButtonOptionsEnum.challengeOverApproaching)
        }
      }
    }
  }, [
    challenge.owner,
    challenge.deadline,
    challenge.supporters,
    account,
    timeInSeconds,
  ])

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
          <ChallengeButtonContainer>
            <TYPE.MediumHeader>
              {buttonOption === ButtonOptionsEnum.challengeDone ||
              buttonOption === ButtonOptionsEnum.challengeOnGoing ||
              buttonOption === ButtonOptionsEnum.challengeOverApproaching ? (
                buttonOption === ButtonOptionsEnum.challengeOverApproaching ? (
                  <TYPE.Yellow>{getButtonText()}</TYPE.Yellow>
                ) : (
                  <TYPE.Green>{getButtonText()}</TYPE.Green>
                )
              ) : (
                <ChallengeButton disabled={false} onClick={handleClick}>
                  {getButtonText()}
                </ChallengeButton>
              )}
            </TYPE.MediumHeader>
          </ChallengeButtonContainer>
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
          isOpenModal={isOpenModal}
          setIsOpenModal={setIsOpenModal}
        />
      )}
      {(buttonOption === ButtonOptionsEnum.castYourVote ||
        buttonOption === ButtonOptionsEnum.submitReport) && (
        <VoteOnChallenge
          challenge={challenge}
          isOwner={challenge.owner === account}
          isOpenModal={isOpenModal}
          setIsOpenModal={setIsOpenModal}
        />
      )}
    </>
  )
}
