#!/bin/bash
echo "POST request Enroll on Org3  ..."
echo
curl -s -X POST \
  http://localhost:8000/register \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'email=admin@comtrade.com&username=adminuser&password=adminuser&orgname=Org3&role=admin'