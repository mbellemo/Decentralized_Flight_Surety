
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
const Web3Utils = require('web3-utils');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {
        //console.log(e)
    }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('(airline) cannot be funded if it is not registered', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];
    let isRegistered = true;

    // ACT
    try {
        await config.flightSuretyData.fund({from: newAirline});
    }
    catch(e) {
        //console.log(e)
        isRegistered = false;
    }
    
    // ASSERT
    assert.equal(isRegistered, false, "Airline should not be able to submit funds if it hasn't been registered");

  });

  it('(airline) cannot be funded if it submits less then 10 ether', async () => {
    
    // ARRANGE
    const fee = Web3Utils.toWei('10', 'ether')

    // ACT
    try {
        await config.flightSuretyData.fund({from: config.firstAirline, value: fee});
    }
    catch(e) {
        console.log(e)
    }
    let result = await config.flightSuretyData.isFunded.call(config.firstAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to submit funds if it is less than 10 Ether");

  });

});
