import React, { useEffect, useState } from "react"
import { Button, Table } from "antd"
import { DefaultLayout } from "../../layout"
import { useApplicationUserDatatable } from "./UserManagement.state"

const UserManagement = () => {
  const { doApplicationUserDatatable, isApplicationUserDatatablePending } = useApplicationUserDatatable()
  const [payload, setPayload] = useState({
    draw: null,
    start: null,
    length: 10,
    page: 1,
    columns: [
      {
        index: 0,
        data: "id",
        name: "id",
        searchable: null,
        orderable: null,
        searchValue: null,
        searchRegex: null
      },
      {
        index: 0,
        data: "application_username",
        name: "application_username",
        searchable: null,
        orderable: null,
        searchValue: null,
        searchRegex: null
      },
      {
        index: 0,
        data: "fullname",
        name: "fullname",
        searchable: null,
        orderable: null,
        searchValue: null,
        searchRegex: null
      },
      {
        index: 0,
        data: "email_address",
        name: "email_address",
        searchable: null,
        orderable: null,
        searchValue: null,
        searchRegex: null
      },
      {
        index: 0,
        data: "business_unit_code",
        name: "business_unit_code",
        searchable: null,
        orderable: null,
        searchValue: null,
        searchRegex: null
      },
      {
        index: 0,
        data: "business_unit_name",
        name: "business_unit_name",
        searchable: null,
        orderable: null,
        searchValue: null,
        searchRegex: null
      },
      {
        index: 0,
        data: "primary_team_id",
        name: "primary_team_id",
        searchable: null,
        orderable: null,
        searchValue: null,
        searchRegex: null
      },
      {
        index: 0,
        data: "primary_team_name",
        name: "primary_team_name",
        searchable: null,
        orderable: null,
        searchValue: null,
        searchRegex: null
      },
    ],
    orders: [
      {
        index: 0,
        columnIndex: null,
        columnName: "id",
        direction: "ASC"
      }
    ],
    filters: {
      id: null,
      field: null,
      value: null,
      operate: null,
      combinator: "and",
      not: false,
      rules: [],
      isGroup: true,
      isRule: false
    },
    search: {
      searchValue: null,
      searchRegex: null
    }
  })
  const [userList, setUserList] = useState({})

  const getApplicationUserDatatable = async () => {
    const res = await doApplicationUserDatatable(payload)
    setUserList(res?.data?.data || [])
  }

  useEffect(() => {
    getApplicationUserDatatable()
  }, [payload])

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 75,
      render: (value: any, item: any, index: number) => index + 1
    },
    {
      title: 'Username',
      dataIndex: 'applicationUsername',
      key: 'applicationUsername',
      width: 200,
    },
    {
      title: 'Name',
      dataIndex: 'fullname',
      key: 'fullname',
      width: 200,
    },
    {
      title: 'Email Address',
      dataIndex: 'emailAddress',
      key: 'emailAddress',
      width: 200,
    },
    {
      title: 'Business Unit Code',
      dataIndex: 'businessUnitCode',
      key: 'businessUnitCode',
      width: 200,
    },
    {
      title: 'Business Unit Name',
      dataIndex: 'businessUnitName',
      key: 'businessUnitName',
      width: 200,
    },
    {
      title: 'Primary Team ID',
      dataIndex: 'primaryTeamId',
      key: 'primaryTeamId',
      width: 200,
    },
    {
      title: 'Primary Team Name',
      dataIndex: 'primaryTeamName',
      key: 'primaryTeamName',
      width: 200,
    },
  ]

  return (
    <DefaultLayout>
      <Button className="m-4" type="primary">Add User</Button>
      <Table
        bordered
        rowKey={"studyInstanceUid"}
        dataSource={userList?.data}
        columns={columns}
        scroll={{ y: 480, scrollToFirstRowOnChange: true, x: "max-content" }}
        loading={isApplicationUserDatatablePending}
      />
    </DefaultLayout>
  )
}

export default UserManagement
