#!/usr/bin/env node
import 'dotenv/config';
import React from 'react';
import { render } from 'ink';
import { App } from '../src/cli/App.js';

const { waitUntilExit } = render(React.createElement(App));

waitUntilExit().catch((err) => {
  console.error(err);
  process.exit(1);
});