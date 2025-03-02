#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ExpenseTrackerStack } from "../lib/cdk-stack";

const app = new cdk.App();
new ExpenseTrackerStack(app, "ExpenseTrackerStack", {});
