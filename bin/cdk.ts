#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { MoneyTrackingSystemStack } from "../lib/cdk-stack";

const app = new cdk.App();
new MoneyTrackingSystemStack(app, "MoneyTrackingSystemStack", {});
