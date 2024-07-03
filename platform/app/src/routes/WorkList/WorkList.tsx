import React, { useState, useEffect, useMemo, useRef } from 'react';
import classnames from 'classnames';
import PropTypes, { object } from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import qs from 'query-string';
import isEqual from 'lodash.isequal';
import { useTranslation } from 'react-i18next';
//
import filtersMeta from './filtersMeta.js';
import { useAppConfig } from '@state';
import { useDebounce, useSearchParams } from '@hooks';
import { utils, hotkeys } from '@ohif/core';
import { Card, Col, Flex, Layout, Menu, Row, Space, Table, Tabs, Tooltip } from 'antd'
import { createEditor } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'

import {
  Icon,
  StudyListExpandedRow,
  EmptyStudies,
  StudyListTable,
  StudyListPagination,
  StudyListFilter,
  TooltipClipboard,
  Header,
  useModal,
  AboutModal,
  UserPreferences,
  LoadingIndicatorProgress,
  useSessionStorage,
  InvestigationalUseDialog,
  Button,
  ButtonEnums,
  ImageViewerProvider,
  DragAndDropProvider,
  ViewportGrid,
} from '@ohif/ui';

import { Types } from '@ohif/ui';

import i18n from '@ohif/i18n';
import Compose from '../Mode/Compose';
import ModeComponent from '../Mode/ModeComponent';
import DefaultLayout from '../../layout/DefaultLayout';
import RichTextEditor from './RichTextEditor';

const PatientInfoVisibility = Types.PatientInfoVisibility;

const { sortBySeriesDate } = utils;

const { availableLanguages, defaultLanguage, currentLanguage } = i18n;

const seriesInStudiesMap = new Map();

/**
 * TODO:
 * - debounce `setFilterValues` (150ms?)
 */
function WorkList({
  data: studies,
  dataTotal: studiesTotal,
  isLoadingData,
  dataSource,
  hotkeysManager,
  dataPath,
  onRefresh,
  servicesManager,
  extensionManager,
  commandsManager,
}: withAppTypes) {
  const { hotkeyDefinitions, hotkeyDefaults } = hotkeysManager;
  const { show, hide } = useModal();
  const { t } = useTranslation();
  const [editor] = useState(() => withReact(createEditor()))
  // ~ Modes
  const [appConfig] = useAppConfig();
  // ~ Filters
  const searchParams = useSearchParams();
  const navigate = useNavigate();
  const STUDIES_LIMIT = 101;
  const queryFilterValues = _getQueryFilterValues(searchParams);
  const [sessionQueryFilterValues, updateSessionQueryFilterValues] = useSessionStorage({
    key: 'queryFilterValues',
    defaultValue: queryFilterValues,
    // ToDo: useSessionStorage currently uses an unload listener to clear the filters from session storage
    // so on systems that do not support unload events a user will NOT be able to alter any existing filter
    // in the URL, load the page and have it apply.
    clearOnUnload: true,
  });
  const [filterValues, _setFilterValues] = useState({
    ...defaultFilterValues,
    ...sessionQueryFilterValues,
  });

  const debouncedFilterValues = useDebounce(filterValues, 200);
  const { resultsPerPage, pageNumber, sortBy, sortDirection } = filterValues;

  /*
   * The default sort value keep the filters synchronized with runtime conditional sorting
   * Only applied if no other sorting is specified and there are less than 101 studies
   */

  const canSort = studiesTotal < STUDIES_LIMIT;
  const shouldUseDefaultSort = sortBy === '' || !sortBy;
  const sortModifier = sortDirection === 'descending' ? 1 : -1;
  const defaultSortValues =
    shouldUseDefaultSort && canSort ? { sortBy: 'studyDate', sortDirection: 'ascending' } : {};
  const sortedStudies = studies;

  if (canSort) {
    studies.sort((s1, s2) => {
      if (shouldUseDefaultSort) {
        const ascendingSortModifier = -1;
        return _sortStringDates(s1, s2, ascendingSortModifier);
      }

      const s1Prop = s1[sortBy];
      const s2Prop = s2[sortBy];

      if (typeof s1Prop === 'string' && typeof s2Prop === 'string') {
        return s1Prop.localeCompare(s2Prop) * sortModifier;
      } else if (typeof s1Prop === 'number' && typeof s2Prop === 'number') {
        return (s1Prop > s2Prop ? 1 : -1) * sortModifier;
      } else if (!s1Prop && s2Prop) {
        return -1 * sortModifier;
      } else if (!s2Prop && s1Prop) {
        return 1 * sortModifier;
      } else if (sortBy === 'studyDate') {
        return _sortStringDates(s1, s2, sortModifier);
      }

      return 0;
    });
  }

  const [linkUrl, setLinkUrl] = useState('');
  const [studyInstanceUID, setStudyInstanceUID] = useState('');
  const [selectedMode, setSelectedMode] = useState<any>();
  const [selectedRow, setSelectedRow] = useState<any>();
  const [activeKey, setActiveKey] = useState("0");
  const [LayoutComponent, setLayoutComponent] = useState<React.JSX.Element>();

  // ~ Rows & Studies
  const [expandedRows, setExpandedRows] = useState([]);
  const [studiesWithSeriesData, setStudiesWithSeriesData] = useState([]);
  const numOfStudies = studiesTotal;
  const querying = useMemo(() => {
    return isLoadingData || expandedRows.length > 0;
  }, [isLoadingData, expandedRows]);

  const setFilterValues = val => {
    if (filterValues.pageNumber === val.pageNumber) {
      val.pageNumber = 1;
    }
    _setFilterValues(val);
    updateSessionQueryFilterValues(val);
    setExpandedRows([]);
  };

  const onPageNumberChange = newPageNumber => {
    const oldPageNumber = filterValues.pageNumber;
    const rollingPageNumberMod = Math.floor(101 / filterValues.resultsPerPage);
    const rollingPageNumber = oldPageNumber % rollingPageNumberMod;
    const isNextPage = newPageNumber > oldPageNumber;
    const hasNextPage = Math.max(rollingPageNumber, 1) * resultsPerPage < numOfStudies;

    if (isNextPage && !hasNextPage) {
      return;
    }

    setFilterValues({ ...filterValues, pageNumber: newPageNumber });
  };

  const onResultsPerPageChange = newResultsPerPage => {
    setFilterValues({
      ...filterValues,
      pageNumber: 1,
      resultsPerPage: Number(newResultsPerPage),
    });
  };

  // Set body style
  useEffect(() => {
    document.body.classList.add('bg-black');
    return () => {
      document.body.classList.remove('bg-black');
    };
  }, []);

  // Sync URL query parameters with filters
  useEffect(() => {
    if (!debouncedFilterValues) {
      return;
    }

    const queryString = {};
    Object.keys(defaultFilterValues).forEach(key => {
      const defaultValue = defaultFilterValues[key];
      const currValue = debouncedFilterValues[key];

      // TODO: nesting/recursion?
      if (key === 'studyDate') {
        if (currValue.startDate && defaultValue.startDate !== currValue.startDate) {
          queryString.startDate = currValue.startDate;
        }
        if (currValue.endDate && defaultValue.endDate !== currValue.endDate) {
          queryString.endDate = currValue.endDate;
        }
      } else if (key === 'modalities' && currValue.length) {
        queryString.modalities = currValue.join(',');
      } else if (currValue !== defaultValue) {
        queryString[key] = currValue;
      }
    });

    const search = qs.stringify(queryString, {
      skipNull: true,
      skipEmptyString: true,
    });

    navigate({
      pathname: '/',
      search: search ? `?${search}` : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilterValues]);

  // Query for series information
  useEffect(() => {
    const fetchSeries = async studyInstanceUid => {
      try {
        const series = await dataSource.query.series.search(studyInstanceUid);
        seriesInStudiesMap.set(studyInstanceUid, sortBySeriesDate(series));
        setStudiesWithSeriesData([...studiesWithSeriesData, studyInstanceUid]);
      } catch (ex) {
        // TODO: UI Notification Service
        console.warn(ex);
      }
    };

    // TODO: WHY WOULD YOU USE AN INDEX OF 1?!
    // Note: expanded rows index begins at 1
    for (let z = 0; z < expandedRows.length; z++) {
      const expandedRowIndex = expandedRows[z] - 1;
      const studyInstanceUid = sortedStudies[expandedRowIndex].studyInstanceUid;

      if (studiesWithSeriesData.includes(studyInstanceUid)) {
        continue;
      }

      fetchSeries(studyInstanceUid);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedRows, studies]);

  const isFiltering = (filterValues, defaultFilterValues) => {
    return !isEqual(filterValues, defaultFilterValues);
  };

  const rollingPageNumberMod = Math.floor(101 / resultsPerPage);
  const rollingPageNumber = (pageNumber - 1) % rollingPageNumberMod;
  const offset = resultsPerPage * rollingPageNumber;
  const offsetAndTake = offset + resultsPerPage;
  const tableDataSource = useMemo(()=> sortedStudies, [sortedStudies]);

  const hasStudies = numOfStudies > 0;
  const versionNumber = process.env.VERSION_NUMBER;
  const commitHash = process.env.COMMIT_HASH;

  const menuOptions = [
    {
      title: t('Header:About'),
      icon: 'info',
      onClick: () =>
        show({
          content: AboutModal,
          title: t('AboutModal:About OHIF Viewer'),
          contentProps: { versionNumber, commitHash },
          containerDimensions: 'max-w-4xl max-h-4xl',
        }),
    },
    {
      title: t('Header:Preferences'),
      icon: 'settings',
      onClick: () =>
        show({
          title: t('UserPreferencesModal:User preferences'),
          content: UserPreferences,
          contentProps: {
            hotkeyDefaults: hotkeysManager.getValidHotkeyDefinitions(hotkeyDefaults),
            hotkeyDefinitions,
            onCancel: hide,
            currentLanguage: currentLanguage(),
            availableLanguages,
            defaultLanguage,
            onSubmit: state => {
              if (state.language.value !== currentLanguage().value) {
                i18n.changeLanguage(state.language.value);
              }
              hotkeysManager.setHotkeys(state.hotkeyDefinitions);
              hide();
            },
            onReset: () => hotkeysManager.restoreDefaultBindings(),
            hotkeysModule: hotkeys,
          },
        }),
    },
  ];

  if (appConfig.oidc) {
    menuOptions.push({
      icon: 'power-off',
      title: t('Header:Logout'),
      onClick: () => {
        navigate(`/logout?redirect_uri=${encodeURIComponent(window.location.href)}`);
      },
    });
  }

  const { customizationService } = servicesManager.services;
  const { component: dicomUploadComponent } =
    customizationService.get('dicomUploadComponent') ?? {};
  const uploadProps =
    dicomUploadComponent && dataSource.getConfig()?.dicomUploadEnabled
      ? {
          title: 'Upload files',
          closeButton: true,
          shouldCloseOnEsc: false,
          shouldCloseOnOverlayClick: false,
          content: dicomUploadComponent.bind(null, {
            dataSource,
            onComplete: () => {
              hide();
              onRefresh();
            },
            onStarted: () => {
              show({
                ...uploadProps,
                // when upload starts, hide the default close button as closing the dialogue must be handled by the upload dialogue itself
                closeButton: false,
              });
            },
          }),
        }
      : undefined;

  const { component: dataSourceConfigurationComponent } =
    customizationService.get('ohif.dataSourceConfigurationComponent') ?? {};

  const ViewportGridWithDataSource = props => {
    return ViewportGrid({ ...props, dataSource });
  };
  const layoutTemplateData = useRef(false);

  useEffect(() => {
    if (!studyInstanceUID) {
      return;
    }

    const getLayoutComponent = props => {
      const layoutTemplateModuleEntry = extensionManager.getModuleEntry(
        layoutTemplateData.current.id
      );
      const LayoutComponent = layoutTemplateModuleEntry?.component;

      return <LayoutComponent {...props} />;
    };

    const retrieveLayoutData = async () => {
      const route = selectedMode?.routes?.[0];
      const layoutData = await route.layoutTemplate({
        location,
        servicesManager,
        studyInstanceUIDs: [studyInstanceUID],
      });

      const { leftPanels = [], rightPanels = [], ...layoutProps } = layoutData.props;

      // layoutProps contains all props but leftPanels and rightPanels
      layoutData.props = layoutProps;

      layoutTemplateData.current = layoutData;

      const LayoutComponent = getLayoutComponent({
        ...layoutData.props,
        ViewportGridComp: ViewportGridWithDataSource,
      });

      setLayoutComponent(LayoutComponent);
    };
    if (studyInstanceUID) {
      retrieveLayoutData();
    }
    return () => {
      layoutTemplateData.current = null;
    };
  }, [studyInstanceUID, selectedMode]);

  const CombinedExtensionsContextProvider = createCombinedContextProvider(
    extensionManager,
    servicesManager,
    commandsManager
  );

  const columns = [
    {
      title: 'Patient Name',
      dataIndex: 'patientName',
      key: 'patientName',
    },
    {
      title: 'MRN',
      dataIndex: 'mrn',
      key: 'mrn',
    },
    {
      title: 'Study Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string, record: any)=> {
        const studyDate =
          date &&
          moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true).isValid() &&
          moment(date, ['YYYYMMDD', 'YYYY.MM.DD']).format(t('Common:localDateFormat', 'MMM-DD-YYYY'));
        const studyTime =
          record?.time &&
          moment(record?.time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS']).isValid() &&
          moment(record?.time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS']).format(
            t('Common:localTimeFormat', 'hh:mm A')
          );
        return `${studyDate || ""} ${studyTime || ""}`
      }
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Modality',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Accession #',
      dataIndex: 'accession',
      key: 'accession',
      render: (data: string) => <TooltipClipboard>{data}</TooltipClipboard>
    },
    {
      title: 'Instances',
      dataIndex: 'instances',
      key: 'instances',
      render: (data)=> <Row>
        <Icon name="group-layers"/>&nbsp;{data}
      </Row>
    },
  ]

  const onRowClick = (study) => {
    const {
      studyInstanceUid,
      modalities,
    } = study;

    return (appConfig.groupEnabledModesFirst
      ? appConfig.loadedModes.sort((a, b) => {
          const isValidA = a.isValidMode({
            modalities: modalities.replaceAll('/', '\\'),
            study,
          }).valid;
          const isValidB = b.isValidMode({
            modalities: modalities.replaceAll('/', '\\'),
            study,
          }).valid;

          return isValidB - isValidA;
        })
      : appConfig.loadedModes
    ).map((mode, i) => {
      const modalitiesToCheck = modalities.replaceAll('/', '\\');

      const { valid: isValidMode, description: invalidModeDescription } = mode.isValidMode({
        modalities: modalitiesToCheck,
        study,
      });

      const query = new URLSearchParams();
      if (filterValues.configUrl) {
        query.append('configUrl', filterValues.configUrl);
      }
      query.append('StudyInstanceUIDs', studyInstanceUid);

      return {
        studyInstanceUid,
        linkUrl: `${dataPath ? '../../' : ''}${mode.routeName}${dataPath || ''}?${query.toString()}`,
        dataCY: `mode-${mode.routeName}-${studyInstanceUid}`,
        displayName: mode.displayName,
        isValidMode: isValidMode,
        invalidModeDescription: invalidModeDescription,
        mode: mode,
      }
    })
  }

  useEffect(()=> {
    if(selectedRow && selectedRow[0]){
      const selected =  selectedRow[0]
      setStudyInstanceUID(selected.studyInstanceUid);
      setLinkUrl(selected.linkUrl);
      setSelectedMode(selected.mode);
      setActiveKey("0");
    } else {
      setStudyInstanceUID(undefined);
      setLinkUrl(undefined);
      setSelectedMode(undefined);
      setActiveKey("0");
    }
  }, [selectedRow])

  const mockDetailDataSource = [{
      "id": 1,
      "thumbnail": "gambar",
      "number": "201",
      "date": "04/06/2024 20:45",
      "modality": "CR",
      "body_part": "THORAX PA",
      "instances": "1",
    },{
      "id": 2,
      "thumbnail": "gambar",
      "number": "202",
      "date": "04/06/2024 20:45",
      "modality": "CR",
      "body_part": "THORAX AP",
      "instances": "1",
    },{
      "id": 3,
      "thumbnail": "gambar",
      "number": "203",
      "date": "04/06/2024 20:45",
      "modality": "CR",
      "body_part": "ABDOMEN",
      "instances": "2",
    },{
      "id": 4,
      "thumbnail": "gambar",
      "number": "204",
      "date": "04/06/2024 20:45",
      "modality": "CR",
      "body_part": "THORAX AP",
      "instances": "1",
    },{
      "id": 5,
      "thumbnail": "gambar",
      "number": "205",
      "date": "04/06/2024 20:45",
      "modality": "CR",
      "body_part": "THORAX PA",
      "instances": "2",
    },
  ]

  const detailColumns = [
    {
      title: 'No',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Thumbnail',
      dataIndex: 'thumbnail',
      key: 'thumbnail',
    },
    {
      title: 'Number',
      dataIndex: 'number',
      key: 'number',
    },
    {
      title: 'Series Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Modality',
      dataIndex: 'modality',
      key: 'modality',
    },
    {
      title: 'Body Part',
      dataIndex: 'body_part',
      key: 'body_part',
    },
    {
      title: 'Instances',
      dataIndex: 'instances',
      key: 'instances',
    },
  ]

  useEffect(()=> {
    if(tableDataSource && tableDataSource[0]){
      const data = onRowClick(tableDataSource[0])
      if(isEqual(selectedRow, data)){
        // setSelectedRow(null)
      } else {
        setSelectedRow(data)
      }
    }
  }, [tableDataSource])

  return (
    <DefaultLayout>
      <Flex>
        <Col md={12}>
          <StudyListFilter
            numOfStudies={pageNumber * resultsPerPage > 100 ? 101 : numOfStudies}
            filtersMeta={filtersMeta}
            filterValues={{ ...filterValues, ...defaultSortValues }}
            onChange={setFilterValues}
            clearFilters={() => setFilterValues(defaultFilterValues)}
            isFiltering={isFiltering(filterValues, defaultFilterValues)}
            onUploadClick={uploadProps ? () => show(uploadProps) : undefined}
            getDataSourceConfigurationComponent={
              dataSourceConfigurationComponent ? () => dataSourceConfigurationComponent() : undefined
            }
          />
          <Table
            rowKey={"studyInstanceUid"}
            dataSource={tableDataSource}
            columns={columns}
            onRow={(record, rowIndex) => {
              return {
                onClick: (event) => {
                  const data = onRowClick(record)
                  if(isEqual(selectedRow, data)){
                    // setSelectedRow(null)
                  } else {
                    setSelectedRow(data)
                  }
                },
              };
            }}
            rowClassName={(record, rowIndex) => {
              const data = onRowClick(record)
              if(isEqual(selectedRow, data)){
                return "ant-table-row-selected cursor-pointer"
              } else {
                return "cursor-pointer"
              }
            }}
            scroll={{ y: 480, scrollToFirstRowOnChange: true }}
          />
          {
            selectedMode &&
              <Table
                rowKey={"id"}
                dataSource={mockDetailDataSource}
                columns={detailColumns}
                pagination={false}
                scroll={{ y: 160, scrollToFirstRowOnChange: true }}
              />
          }
        </Col>
        {
          selectedMode &&
          <Col md={12} style={{padding: '16px', paddingTop: '170px'}}>
            <Tabs
              activeKey={activeKey}
              onChange={(key)=> {
                if(selectedRow && selectedRow[key]){
                  const selected =  selectedRow[key]
                  setStudyInstanceUID(selected.studyInstanceUid);
                  setLinkUrl(selected.linkUrl);
                  setSelectedMode(selected.mode);
                  setActiveKey(key)
                }
              }}
              type="card"
              items={(selectedRow || []).map((item, index)=> {
                return {
                  label: <Tooltip title={!item.isValidMode? item.invalidModeDescription: ""}>{`${item.displayName}`}</Tooltip> ,
                  key: index.toString(),
                  disabled: !item.isValidMode,
                };
              })}
            />
            <ModeComponent
              mode={selectedMode}
              extensionManager={extensionManager}
              servicesManager={servicesManager}
              commandsManager={commandsManager}
              hotkeysManager={hotkeysManager}
              studyInstanceUIDs={[studyInstanceUID]}
            />
            <br/>
            <Card>
              <RichTextEditor />
            </Card>
          </Col>
        }
      </Flex>
    </DefaultLayout>
  );
}

WorkList.propTypes = {
  data: PropTypes.array.isRequired,
  dataSource: PropTypes.shape({
    query: PropTypes.object.isRequired,
    getConfig: PropTypes.func,
  }).isRequired,
  isLoadingData: PropTypes.bool.isRequired,
  servicesManager: PropTypes.object.isRequired,
};

const defaultFilterValues = {
  patientName: '',
  mrn: '',
  studyDate: {
    startDate: null,
    endDate: null,
  },
  description: '',
  modalities: [],
  accession: '',
  sortBy: '',
  sortDirection: 'none',
  pageNumber: 1,
  resultsPerPage: 25,
  datasources: '',
  configUrl: null,
};

function _tryParseInt(str, defaultValue) {
  let retValue = defaultValue;
  if (str && str.length > 0) {
    if (!isNaN(str)) {
      retValue = parseInt(str);
    }
  }
  return retValue;
}

function _getQueryFilterValues(params) {
  const newParams = new URLSearchParams();
  for (const [key, value] of params) {
    newParams.set(key.toLowerCase(), value);
  }
  params = newParams;

  const queryFilterValues = {
    patientName: params.get('patientname'),
    mrn: params.get('mrn'),
    studyDate: {
      startDate: params.get('startdate') || null,
      endDate: params.get('enddate') || null,
    },
    description: params.get('description'),
    modalities: params.get('modalities') ? params.get('modalities').split(',') : [],
    accession: params.get('accession'),
    sortBy: params.get('sortby'),
    sortDirection: params.get('sortdirection'),
    pageNumber: _tryParseInt(params.get('pagenumber'), undefined),
    resultsPerPage: _tryParseInt(params.get('resultsperpage'), undefined),
    datasources: params.get('datasources'),
    configUrl: params.get('configurl'),
  };

  // Delete null/undefined keys
  Object.keys(queryFilterValues).forEach(
    key => queryFilterValues[key] == null && delete queryFilterValues[key]
  );

  return queryFilterValues;
}

function _sortStringDates(s1, s2, sortModifier) {
  // TODO: Delimiters are non-standard. Should we support them?
  const s1Date = moment(s1.date, ['YYYYMMDD', 'YYYY.MM.DD'], true);
  const s2Date = moment(s2.date, ['YYYYMMDD', 'YYYY.MM.DD'], true);

  if (s1Date.isValid() && s2Date.isValid()) {
    return (s1Date.toISOString() > s2Date.toISOString() ? 1 : -1) * sortModifier;
  } else if (s1Date.isValid()) {
    return sortModifier;
  } else if (s2Date.isValid()) {
    return -1 * sortModifier;
  }
}

/**
 * Creates a combined context provider using the context modules from the extension manager.
 * @param {object} extensionManager - The extension manager instance.
 * @param {object} servicesManager - The services manager instance.
 * @param {object} commandsManager - The commands manager instance.
 * @returns {React.Component} - A React component that provides combined contexts to its children.
 */
function createCombinedContextProvider(extensionManager, servicesManager, commandsManager) {
  const extensionsContextModules = extensionManager.getModulesByType(
    extensionManager.constructor.MODULE_TYPES.CONTEXT
  );

  if (!extensionsContextModules?.length) {
    return;
  }

  const contextModuleProviders = extensionsContextModules.flatMap(({ module }) => {
    return module.map(aContextModule => {
      return aContextModule.provider;
    });
  });

  return ({ children }) => {
    return Compose({ components: contextModuleProviders, children });
  };
}

export default WorkList;
