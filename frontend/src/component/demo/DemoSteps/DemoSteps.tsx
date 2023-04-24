import Joyride, {
    ACTIONS,
    CallBackProps,
    TooltipRenderProps,
} from 'react-joyride';
import { Button, Typography, styled, useTheme } from '@mui/material';
import { ITutorialTopic, ITutorialTopicStep } from '../demo-topics';
import { useEffect, useState } from 'react';
import { ConditionallyRender } from 'component/common/ConditionallyRender/ConditionallyRender';
import { useLocation, useNavigate } from 'react-router-dom';

const StyledTooltip = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    borderRadius: theme.shape.borderRadiusMedium,
    width: '100%',
    maxWidth: theme.spacing(45),
    padding: theme.spacing(3),
}));

const StyledTooltipTitle = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
    flexWrap: 'wrap',
}));

const StyledTooltipActions = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(3),
    '&&& button': {
        '&:first-of-type': {
            marginLeft: theme.spacing(-2),
        },
        fontSize: theme.fontSizes.smallBody,
    },
}));

const StyledTooltipPrimaryActions = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
}));

interface IDemoStepsProps {
    setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
    steps: number[];
    setSteps: React.Dispatch<React.SetStateAction<number[]>>;
    topic: number;
    setTopic: React.Dispatch<React.SetStateAction<number>>;
    topics: ITutorialTopic[];
    onFinish: () => void;
}

export const DemoSteps = ({
    setExpanded,
    steps,
    setSteps,
    topic,
    setTopic,
    topics,
    onFinish,
}: IDemoStepsProps) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [run, setRun] = useState(false);
    const [flow, setFlow] = useState<'next' | 'back' | 'load'>('load');

    const abortController = new AbortController();

    const setTopicStep = (topic: number, step?: number) => {
        setRun(false);
        setTopic(topic);
        if (step !== undefined) {
            setSteps(steps => {
                const newSteps = [...steps];
                newSteps[topic] = step;
                return newSteps;
            });
        }
    };

    const skip = () => {
        abortController.abort();
        setTopicStep(-1);
        setExpanded(false);
    };

    const back = () => {
        setFlow('back');
        if (steps[topic] === 0) {
            const newTopic = topic - 1;
            setTopicStep(newTopic, topics[newTopic].steps.length - 1);
        } else {
            setTopicStep(topic, steps[topic] - 1);
        }
    };

    const nextTopic = () => {
        if (topic === topics.length - 1) {
            setTopicStep(-1);
            setExpanded(false);
            onFinish();
        } else {
            const newTopic = topic + 1;
            setTopicStep(newTopic, 0);
        }
    };

    const next = (index = steps[topic]) => {
        setFlow('next');
        setTopicStep(topic, index + 1);
        if (index === topics[topic].steps.length - 1) {
            nextTopic();
        }
    };

    const joyrideCallback = (
        data: CallBackProps & {
            step: ITutorialTopicStep;
        }
    ) => {
        const { action, index, step } = data;

        if (action === ACTIONS.UPDATE) {
            const el = document.querySelector(step.target as string);
            if (el) {
                el.scrollIntoView({
                    block: 'center',
                });
                if (!step.nextButton) {
                    const clickHandler = (e: Event) => {
                        abortController.abort();
                        next(index);
                        if (step.preventDefault) {
                            e.preventDefault();
                        }
                    };

                    if (step.anyClick) {
                        window.addEventListener('click', clickHandler, {
                            signal: abortController.signal,
                        });
                    } else {
                        el.addEventListener('click', clickHandler, {
                            signal: abortController.signal,
                        });
                    }
                }
            }
        }
    };

    const onBack = (step: ITutorialTopicStep) => {
        if (step.backCloseModal) {
            (
                document.querySelector('.MuiModal-backdrop') as HTMLElement
            )?.click();
        }
        if (step.backCollapseExpanded) {
            (
                document.querySelector(
                    '.Mui-expanded[role="button"]'
                ) as HTMLElement
            )?.click();
        }
        back();
    };

    const waitForLoad = (step: ITutorialTopicStep, tries = 0) => {
        setTimeout(() => {
            if (document.querySelector(step.target as string)) {
                setRun(true);
            } else {
                if (flow === 'next' && step.optional) {
                    next();
                } else if (flow === 'back' || tries > 4) {
                    back();
                } else {
                    waitForLoad(step, tries + 1);
                }
            }
        }, 300);
    };

    useEffect(() => {
        if (topic === -1) return;
        const currentTopic = topics[topic];
        const currentStepIndex = steps[topic];
        const currentStep = currentTopic.steps[currentStepIndex];
        if (!currentStep) return;

        if (currentStep.href && location.pathname !== currentStep.href) {
            navigate(currentStep.href);
        }
        waitForLoad(currentStep);
    }, [topic, steps]);

    useEffect(() => {
        if (topic > -1) topics[topic].setup?.();
    }, [topic]);

    if (topic === -1) return null;

    const joyrideSteps = topics[topic].steps.map(step => ({
        ...step,
        disableBeacon: true,
    }));

    return (
        <Joyride
            run={run}
            stepIndex={steps[topic]}
            callback={joyrideCallback}
            steps={joyrideSteps}
            disableScrolling
            disableOverlayClose
            spotlightClicks
            spotlightPadding={0}
            floaterProps={{
                disableAnimation: true,
                styles: {
                    floater: {
                        filter: `drop-shadow(${theme.palette.primary.main} 0px 0px 3px)`,
                    },
                },
            }}
            styles={{
                options: {
                    arrowColor: theme.palette.background.paper,
                    zIndex: theme.zIndex.snackbar,
                },
                spotlight: {
                    borderRadius: theme.shape.borderRadiusMedium,
                    border: `2px solid ${theme.palette.primary.main}`,
                    outline: `2px solid ${theme.palette.secondary.border}`,
                    backgroundColor: 'transparent',
                },
                overlay: {
                    backgroundColor: 'transparent',
                    mixBlendMode: 'unset',
                },
            }}
            tooltipComponent={({
                step,
                tooltipProps,
            }: TooltipRenderProps & {
                step: ITutorialTopicStep;
            }) => (
                <StyledTooltip {...tooltipProps}>
                    <StyledTooltipTitle>
                        <ConditionallyRender
                            condition={Boolean(step.title)}
                            show={step.title}
                            elseShow={
                                <Typography fontWeight="bold">
                                    {topics[topic].title}
                                </Typography>
                            }
                        />
                        <ConditionallyRender
                            condition={topics[topic].steps.length > 1}
                            show={
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    flexShrink={0}
                                >
                                    (step {steps[topic] + 1} of{' '}
                                    {topics[topic].steps.length})
                                </Typography>
                            }
                        />
                    </StyledTooltipTitle>
                    {step.content}
                    <StyledTooltipActions>
                        <Button variant="text" onClick={skip}>
                            Skip
                        </Button>
                        <StyledTooltipPrimaryActions>
                            <ConditionallyRender
                                condition={topic > 0 || steps[topic] > 0}
                                show={
                                    <Button
                                        variant="outlined"
                                        onClick={() => onBack(step)}
                                    >
                                        Back
                                    </Button>
                                }
                            />
                            <ConditionallyRender
                                condition={Boolean(step.nextButton)}
                                show={
                                    <Button
                                        onClick={() => next(steps[topic])}
                                        variant="contained"
                                    >
                                        {topic === topics.length - 1 &&
                                        steps[topic] ===
                                            topics[topic].steps.length - 1
                                            ? 'Finish'
                                            : 'Next'}
                                    </Button>
                                }
                            />
                        </StyledTooltipPrimaryActions>
                    </StyledTooltipActions>
                </StyledTooltip>
            )}
        />
    );
};