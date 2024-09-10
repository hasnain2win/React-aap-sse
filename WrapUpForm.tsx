import {Add, DeleteOutline} from '@mui/icons-material';
import {Button, Divider, Grid, LinearProgress, Skeleton, Stack, Typography, useTheme} from '@mui/material';
import {Field, FieldArray, Form, Formik, FormikErrors, useFormikContext} from 'formik';
import {Select, TextField} from 'formik-mui';
import React from 'react';
import * as Yup from 'yup';
import CheckIcon from '@mui/icons-material/Check';

import {useLaunchDarklyState} from '../../../../common/layouts/useLaunchDarklyState';
import {Capability} from '../../../../common/layouts/LaunchDarkly-Interface';
import {buttonColor, buttonSize, buttonVarient} from '../../../../../constants';
import wrapupContent from '../../../../../mocks/content/member/wrapup/wrapup-title-mock.json';
import {DynamicModal} from '../../../../common/components/DynamicModal/DynamicModal';
import {SecureMessagePage} from '../../ContactHistory/SecureMessage/SecureMessageModal/SecureMessagePage';
import {SmartNotesAssociatedData} from '../AutoNotes/SmartNotesAssociatedData';
import {useCallNotes} from '../../../../common/hooks/useCallNotes';
import {useSmartNotesAPI} from '../AutoNotes/useSmartNotesAPI';
import {SmartNotesAILabel} from '../AutoNotes/SmartNotesAILabel';
import {SmartNotesButton} from '../AutoNotes/SmartNotesButton';
import SmartNotesTextField from '../AutoNotes/SmartNotesTextField';

import {useStyles} from './WrapUp.Styles';
import {createMUISwitch} from './PrimarySwitch';
import {CategoriesList, Reasons, WrapUpFormState} from './Wrapup.types';
import {useWrapUpFormState} from './useWrapUpForm';

const {pleaseSelect, primary, deleteButtonText, submitText, addAnotherReason, defaultSmartNotes} =
  wrapupContent.responses.success.data;
export interface WrapUpFormProps {
  isLoading?: boolean;
  categories: CategoriesList[];
  form: {
    initialValues?: WrapUpFormState;
    onSubmit: (props: WrapUpFormState) => void;
    postWrapUpDetails: () => void;
    isShowSecureModal: boolean;
    setIsShowSecureModal: (isShow: boolean) => void;
    setIsSecureMessageFormSubmitted: (isSubmitted: boolean) => void;
    setIsWrapupClicked: (isClicked: boolean) => void;
  };
}
const validationSchema = Yup.object().shape({
  notes: Yup.string().max(4000, 'Should not exceed 4000 characters').required('please add your notes'),
  WrapUpDocumentation: Yup.array().of(
    Yup.object().shape({
      category: Yup.string().required('please select a category'),
      reason: Yup.string()
        .required('please select a reason')
        .test('unique reason', 'Reason should be different for same category', function uniqueReason(value, arr) {
          const WrapUpDocumentationArr = (arr?.from && arr?.from[1]?.value?.WrapUpDocumentation) || [];
          const seenPairs = new Set();
          let isValid = true;
          WrapUpDocumentationArr?.forEach(({category, reason}: {category: number; reason: string}) => {
            const pair = `${category}-${reason}`;
            if (seenPairs.has(pair)) {
              isValid = false;
            } else {
              seenPairs.add(pair);
            }
          });
          return isValid;
        })
    })
  )
});
const SaveChanges = ({onSubmit}: {onSubmit: (props: WrapUpFormState) => void}) => {
  const {values, dirty, isSubmitting, initialValues, setSubmitting} = useFormikContext<WrapUpFormState>();
  const {wrapUpInfoResult, wrapUpInfoToNavResult} = useWrapUpFormState();
  const debounceTimeout = React.useRef<number | null>(null);

  React.useEffect(() => {
    const debounceDelay = 200;
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    if (dirty) {
      debounceTimeout.current = window.setTimeout(() => {
        onSubmit(values);
      }, debounceDelay);
    }
    if (isSubmitting) {
      onSubmit(initialValues);
    }
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [values, dirty, isSubmitting, initialValues]);

  React.useEffect(() => {
    if (wrapUpInfoResult.isError || (wrapUpInfoResult.result?.respCode === 201 && wrapUpInfoToNavResult.isError)) {
      setSubmitting(false);
    }
  }, [wrapUpInfoResult, wrapUpInfoToNavResult]);

  return null;
};

export const WrapUpForm: React.FC<WrapUpFormProps> = (props) => {
  const [editable, setEditable] = React.useState(false);

  const {callNotes} = useCallNotes();
  const {
    isLoading: smartNotesLoading = false,
    smartNotes,
    isError: smartNotesIsError,
    error: smartNotesError,
    currentStatus
  } = useSmartNotesAPI();
  const {isLDFlagEnabled} = useLaunchDarklyState();
  const renderSmartNotes = true; //isLDFlagEnabled(Capability.SmartNotes, 'Smart Notes') && currentStatus !== 'Disconnected';
  const [previousSmartNotes, setPreviousSmartNotes] = React.useState(smartNotes);
  const [finalSmartNotes, setFinalSmartNotes] = React.useState(smartNotes);
  const [enableUndoButton, setEnableUndoButton] = React.useState(false);

  const initialState: WrapUpFormState = {
    WrapUpDocumentation: [
      {
        category: '',
        reason: '',
        isPrimary: true,
        categoryName: '',
        reasonName: ''
      }
    ],
    notes: ''
  };

  const smartInitialState = {...initialState, smartNotes};
  const muiTheme = useTheme();
  const {classes} = useStyles();

  const MaterialUISwitch = createMUISwitch(muiTheme);
  function submitForm() {
    props.form.postWrapUpDetails();
  }
  React.useEffect(() => {
    if (finalSmartNotes !== previousSmartNotes) {
      setEnableUndoButton(true);
    }
  }, [finalSmartNotes, previousSmartNotes]);

  const undoSmartNotes = (setFieldValue: {
    (field: string, value: any, shouldValidate?: boolean | undefined): Promise<void | FormikErrors<WrapUpFormState>>;
    (arg0: string, arg1: string): void;
  }) => {
    return () => {
      setEnableUndoButton(false);
      setFieldValue('smartNotes', previousSmartNotes);
      setFinalSmartNotes(previousSmartNotes);
    };
  };
  const editSmartNotes = () => {
    setEditable(true);
  };

  const saveSmartNotes = () => {
    setEnableUndoButton(false);
    setEditable(false);
    setPreviousSmartNotes(finalSmartNotes);
  };

  const FormInitialValues = renderSmartNotes
    ? props.form.initialValues && {...props.form.initialValues, smartNotes}
    : props.form.initialValues;

  const InitialWrapupState = renderSmartNotes ? smartInitialState : initialState;

  return (
    <Formik
      initialValues={FormInitialValues || InitialWrapupState}
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={submitForm}
    >
      {({submitForm, isSubmitting, values, setFieldValue}) => {
        return (
          <Form id="wrap-up-form">
            {isSubmitting && <LinearProgress />}
            <Grid container direction={'row'} spacing={3}>
              <FieldArray
                name="WrapUpDocumentation"
                render={(arrayHelpers) => (
                  <>
                    {values.WrapUpDocumentation.map((selectedCategoryReason, index) => (
                      <React.Fragment key={selectedCategoryReason.category + selectedCategoryReason.reason}>
                        <Grid item xs={12}>
                          <Stack spacing={3}>
                            <Field
                              component={Select}
                              native
                              value={selectedCategoryReason.category}
                              name={`WrapUpDocumentation.${index}.category`}
                              label="Select category"
                              fullWidth
                              required
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                arrayHelpers.replace(index, {
                                  ...selectedCategoryReason,
                                  category: e?.target?.value,
                                  categoryName: e.target.options[e.target.selectedIndex].text
                                });
                              }}
                            >
                              <option value="" disabled>
                                {pleaseSelect}
                              </option>
                              {props.categories?.map((obj) => {
                                return (
                                  <option key={obj.uid} value={obj.uid}>
                                    {obj.categoryName}
                                  </option>
                                );
                              })}
                            </Field>
                            <Field
                              component={Select}
                              native
                              value={selectedCategoryReason.reason}
                              name={`WrapUpDocumentation.${index}.reason`}
                              label="Select reason"
                              fullWidth
                              required
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                arrayHelpers.replace(index, {
                                  ...selectedCategoryReason,
                                  reason: e?.target?.value,
                                  reasonName: e.target.options[e.target.selectedIndex].text
                                })
                              }
                            >
                              <option value="" disabled>
                                {pleaseSelect}
                              </option>
                              {props.categories
                                ?.find((category) => category.uid === parseInt(selectedCategoryReason.category))
                                ?.reasons?.map((obj: Reasons) => {
                                  return (
                                    <option key={obj?.reasonId} value={obj?.reasonId}>
                                      {obj?.reasonName}
                                    </option>
                                  );
                                })}{' '}
                            </Field>
                            <Grid xs={12} container direction={'row'} justifyContent={'space-between'}>
                              <Grid item xs={10}>
                                <Typography variant="subtitle2">
                                  <strong>{primary}</strong>
                                </Typography>
                              </Grid>
                              <Grid item xs={2}>
                                <Field
                                  component={MaterialUISwitch}
                                  type="checkbox"
                                  name="primary"
                                  checked={selectedCategoryReason.isPrimary}
                                  onChange={() => {
                                    if (!selectedCategoryReason.isPrimary) {
                                      values?.WrapUpDocumentation?.forEach((val, i) => {
                                        if (i === index) {
                                          arrayHelpers.replace(index, {
                                            ...val,
                                            isPrimary: !selectedCategoryReason.isPrimary
                                          });
                                        } else if (val.isPrimary) {
                                          arrayHelpers.replace(i, {
                                            ...val,
                                            isPrimary: false
                                          });
                                        }
                                      });
                                    }
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </Stack>
                        </Grid>
                        <Grid container item xs={12} justifyContent={'flex-end'}>
                          {index + 1 === values?.WrapUpDocumentation?.length &&
                            values?.WrapUpDocumentation?.length < 5 && (
                              <Grid item xs={!selectedCategoryReason?.isPrimary ? 8 : 9}>
                                <Button
                                  variant="text"
                                  size="small"
                                  color="primary"
                                  startIcon={<Add />}
                                  onClick={() =>
                                    arrayHelpers.push({
                                      category: '',
                                      reason: '',
                                      isPrimary: false
                                    })
                                  }
                                >
                                  {addAnotherReason}
                                </Button>
                              </Grid>
                            )}
                          {!selectedCategoryReason?.isPrimary && (
                            <Grid item xs={4}>
                              <Button
                                variant="text"
                                size="small"
                                color="primary"
                                startIcon={<DeleteOutline />}
                                onClick={() => arrayHelpers.remove(index)}
                              >
                                {deleteButtonText}
                              </Button>
                            </Grid>
                          )}
                        </Grid>
                        {!renderSmartNotes && (
                          <Grid item xs={12}>
                            <Divider />
                          </Grid>
                        )}
                      </React.Fragment>
                    ))}
                  </>
                )}
              />
              {!renderSmartNotes && (
                <Grid item xs={12}>
                  <Field
                    component={TextField}
                    name="notes"
                    label="All notes"
                    fullWidth
                    multiline
                    minRows={5}
                    maxRows={5}
                    textField={{
                      placeholder: addAnotherReason
                    }}
                    onBlur={() => props.form.onSubmit(values)}
                  />
                </Grid>
              )}
              {!renderSmartNotes && (
                <Grid item xs={12}>
                  <DynamicModal
                    displayComponent={(closeModal) => (
                      <SecureMessagePage
                        closeModal={() => {
                          closeModal();
                          props.form.setIsShowSecureModal(false);
                          props.form.setIsWrapupClicked(false);
                        }}
                        setIsSecureMessageFormSubmitted={props.form.setIsSecureMessageFormSubmitted}
                      />
                    )}
                    openDynamicModal={props.form.isShowSecureModal}
                    setCloseModal={() => {
                      props.form.setIsShowSecureModal(false);
                      props.form.setIsWrapupClicked(false);
                    }}
                    actionComponent={() => (
                      <Button variant="contained" color="primary" disabled={isSubmitting} onClick={submitForm}>
                        {submitText}
                      </Button>
                    )}
                  />
                </Grid>
              )}
            </Grid>
            {!renderSmartNotes && <SaveChanges onSubmit={props.form.onSubmit} />}
            {renderSmartNotes && (
              <>
                <Grid item xs={12} className={classes.smartNotesTop}>
                  <Divider />
                </Grid>
                <Typography variant="h4" mb={2} mt={2}>
                  <strong>Smart Notes</strong>
                </Typography>
                {smartNotesLoading && (
                  <>
                    <SmartNotesAILabel />
                    <Grid container spacing={2} paddingTop={3} data-testId="loading">
                      <Skeleton width="100%" height={20} style={{marginBottom: 6, marginLeft: 10}} />
                      <Skeleton width="100%" height={20} style={{marginBottom: 6, marginLeft: 10}} />
                      <Skeleton width="100%" height={20} style={{marginBottom: 6, marginLeft: 10}} />
                      <Skeleton width="40%" height={20} style={{marginBottom: 6, marginLeft: 10}} />
                    </Grid>
                  </>
                )}
                {smartNotesIsError && (
                  <>
                    <SmartNotesAILabel /> <div>{smartNotesError}</div>
                  </>
                )}
                {smartNotes && (
                  <>
                    <SmartNotesAILabel />
                    <Grid container direction={'row'} spacing={3} marginTop={0.1}>
                      <Grid item xs={12}>
                        <Field
                          component={SmartNotesTextField}
                          name="smartNotes"
                          label="Smart notes"
                          editable={editable}
                          setFinalSmartNotes={setFinalSmartNotes}
                        />
                      </Grid>
                      <Grid container direction="row" className={classes.buttonContainer}>
                        {!editable && (
                          <>
                            <SmartNotesButton
                              buttonText={'Submit wrap up'}
                              color={buttonColor.primary}
                              variant={buttonVarient.contained}
                              size={buttonSize.medium}
                            />
                            <SmartNotesButton
                              buttonText={'Edit'}
                              color={buttonColor.secondary}
                              variant={buttonVarient.contained}
                              size={buttonSize.medium}
                              onClickAction={editSmartNotes}
                            />
                          </>
                        )}
                        {editable && (
                          <>
                            <SmartNotesButton
                              buttonText={'Save'}
                              color={buttonColor.primary}
                              variant={buttonVarient.contained}
                              size={buttonSize.medium}
                              onClickAction={saveSmartNotes}
                              endIcon={<CheckIcon />}
                            />
                            <SmartNotesButton
                              buttonText={'Undo'}
                              isDisabled={!enableUndoButton}
                              color={buttonColor.secondary}
                              variant={buttonVarient.contained}
                              size={buttonSize.medium}
                              onClickAction={undoSmartNotes(setFieldValue)}
                            />
                          </>
                        )}
                      </Grid>
                    </Grid>
                  </>
                )}
                {!smartNotes && !smartNotesLoading && !smartNotesIsError && (
                  <Typography data-testId="default" variant="subtitle2" mb={2}>
                    {defaultSmartNotes}
                  </Typography>
                )}
                <SmartNotesAssociatedData notes={callNotes} data-testId="smarts-notes" />
              </>
            )}
          </Form>
        );
      }}
    </Formik>
  );
};
