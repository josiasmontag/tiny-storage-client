const s3 = require('../s3.js');
const assert = require('assert');
const nock   = require('nock');
const fs     = require('fs');
const path   = require('path');

let storage = {};
const url1S3 = 'https://s3.gra.first.cloud.test';
const url2S3 = 'https://s3.de.first.cloud.test';

/** ASSETS for download/upload */
const fileTxtPath = path.join(__dirname, 'assets', 'file.txt');
const fileTxt = fs.readFileSync(fileTxtPath).toString();
const fileXmlPath = path.join(__dirname, 'assets', 'files.xml');
const fileXml = fs.readFileSync(fileXmlPath).toString();
/** ASSETS for List objects Requests */
const _listObjectsResponseXML = fs.readFileSync(path.join(__dirname, "./assets", 'listObjects.response.xml'));
const _listObjectsResponseJSON = require('./assets/listObjects.response.json');

describe.only('S3 SDK', function () {

  beforeEach(function() {
    storage = s3([{
      accessKeyId    : '2371bebbe7ac4b2db39c09eadf011661',
      secretAccessKey: '9978f6abf7f445566a2d316424aeef2',
      url            : url1S3.replace('https://', ''),
      region         : 'gra'
    },
    {
      accessKeyId    : '2371bebbe7ac4b2db39c09eadf011661',
      secretAccessKey: '9978f6abf7f445566a2d316424aeef2',
      url            : url2S3.replace('https://', ''),
      region         : 'de'
    }]);
  })

  describe('constructor/getConfig/setConfig/setTimeout', function () {
    it("should create a new s3 instance if the authentication is provided as Object", function () {
      const _authS3 = { accessKeyId: '-', secretAccessKey: '-', region: '-', url: '-' }
      const _storage = s3(_authS3);
      const _config = _storage.getConfig()
      assert.strictEqual(_config.timeout, 5000);
      assert.strictEqual(_config.activeStorage, 0);
      assert.strictEqual(_config.storages.length, 1);
      assert.strictEqual(JSON.stringify(_config.storages[0]), JSON.stringify(_authS3))
    })

    it("should create a new s3 instance if the authentication is provided as List of objects", function () {
      const _authS3 = [{ accessKeyId: 1, secretAccessKey: 2, region: 3, url: 4 }, { accessKeyId: 5, secretAccessKey: 6, region: 7, url: 8 }, { accessKeyId: 9, secretAccessKey: 10, region: 11, url: 12 }]
      const _storage = s3(_authS3);
      const _config = _storage.getConfig()
      assert.strictEqual(_config.timeout, 5000);
      assert.strictEqual(_config.activeStorage, 0);
      assert.strictEqual(_config.storages.length, 3);
      assert.strictEqual(JSON.stringify(_config.storages), JSON.stringify(_authS3))
    })

    it("should throw an error if authentication values are missing", function() {
      assert.throws(function(){ s3({}) }, Error);
      /** As object */
      assert.throws(function(){ s3({accessKeyId: '', secretAccessKey: '', url: ''}) }, Error); // missing region
      assert.throws(function(){ s3({accessKeyId: '', secretAccessKey: '', region: ''}) }, Error); // missing url
      assert.throws(function(){ s3({accessKeyId: '', url: '', region: ''}) }, Error); // missing secretAccessKey
      assert.throws(function(){ s3({secretAccessKey: '', url: '', region: ''}) }, Error); // missing accessKeyId
      /** As array */
      assert.throws(function(){ s3([{ accessKeyId: 1, secretAccessKey: 2, region: 3, url: 4 }, { accessKeyId: 5, secretAccessKey: 6, url: 8 }]) }, Error); // missing region
      assert.throws(function(){ s3([{ accessKeyId: 1, secretAccessKey: 2, region: 3, url: 4 }, { accessKeyId: 5, secretAccessKey: 6, region: 8 }]) }, Error); // missing url
      assert.throws(function(){ s3([{ accessKeyId: 1, secretAccessKey: 2, region: 3, url: 4 }, { accessKeyId: 5, region: 6, url: 8 }]) }, Error); // missing secretAccessKey
      assert.throws(function(){ s3([{ accessKeyId: 1, secretAccessKey: 2, region: 3, url: 4 }, { secretAccessKey: 5, region: 6, url: 8 }]) }, Error); // missing accessKeyId
    });

    it("should set a new config", function () {
      const _storage = s3({ accessKeyId: '-', secretAccessKey: '-', region: '-', url: '-' });
      const _authS3 = [{ accessKeyId: 1, secretAccessKey: 2, region: 3, url: 4 }, { accessKeyId: 5, secretAccessKey: 6, region: 7, url: 8 }]
      _storage.setConfig(_authS3)
      const _config = _storage.getConfig()
      assert.strictEqual(_config.timeout, 5000);
      assert.strictEqual(_config.activeStorage, 0);
      assert.strictEqual(_config.storages.length, 2);
      assert.strictEqual(JSON.stringify(_config.storages), JSON.stringify(_authS3))
    })

    it("should set a new timeout value", function() {
      const _storage = s3({ accessKeyId: '-', secretAccessKey: '-', region: '-', url: '-' });
      assert.strictEqual(_storage.getConfig().timeout, 5000);
      _storage.setTimeout(10000);
      assert.strictEqual(_storage.getConfig().timeout, 10000);
    });
  })

  describe('request - CALLBACK', function() {

    describe("REQUEST MAIN STORAGE", function () {

    });

    describe("SWITCH TO CHILD STORAGE", function () {
    });

  });

  describe('request - STREAM', function() {

    describe("REQUEST MAIN STORAGE", function () {
    });

    describe("SWITCH TO CHILD STORAGE", function () {
    });

  });

  describe('headBucket', function() {
    it('should return code 200, and request signed with AWS4', function (done) {
      const nockRequest = nock(url1S3,
        {
          reqheaders: {
            'x-amz-content-sha256': () => true,
            'x-amz-date': () => true,
            'authorization': () => true,
            'host': () => true
          }
        }).intercept("/customBucket", "HEAD").reply(200, '');

      storage.headBucket('customBucket', function(err, resp) {
        assert.strictEqual(err, null);
        assert.strictEqual(resp.statusCode, 200);
        assert.strictEqual(resp.body.toString(), '');
        assert.strictEqual(nockRequest.pendingMocks().length, 0);
        done();
      });
    });

    it('should return code 403 Forbidden', function (done) {
      const nockRequest = nock(url1S3).intercept("/customBucket", "HEAD").reply(403, '');

      storage.headBucket('customBucket', function(err, resp) {
        assert.strictEqual(err, null);
        assert.strictEqual(resp.statusCode, 403);
        assert.strictEqual(resp.body.toString(), '');
        assert.strictEqual(nockRequest.pendingMocks().length, 0);
        done();
      });
    });
  });

  describe('listFiles', function() {

    describe("REQUEST MAIN STORAGE", function () {
      it('should fetch a list of objects', function (done) {
        const _header = {
          'content-type': 'application/xml',
          'content-length': '1887',
          'x-amz-id-2': 'txf0b438dfd25b444ba3f60-00641807d7',
          'x-amz-request-id': 'txf0b438dfd25b444ba3f60-00641807d7',
          'x-trans-id': 'txf0b438dfd25b444ba3f60-00641807d7',
          'x-openstack-request-id': 'txf0b438dfd25b444ba3f60-00641807d7',
          date: 'Mon, 20 Mar 2023 07:14:31 GMT',
          connection: 'close'
        }

        const nockRequest = nock(url1S3)
          .defaultReplyHeaders(_header)
          .get('/bucket')
          .query({ 'list-type' : 2 })
          .reply(200, () => {
            return _listObjectsResponseXML;
          });

        storage.listFiles('bucket', (err, resp) => {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(JSON.stringify(resp.body), JSON.stringify(_listObjectsResponseJSON));
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_header))
          assert.strictEqual(nockRequest.pendingMocks().length, 0);
          done();
        })
      })

      it('should fetch a list of objects with query parameters (prefix & limit)', function (done) {
        const _header = {
          'content-type': 'application/xml',
          'content-length': '1887',
          'x-amz-id-2': 'txf0b438dfd25b444ba3f60-00641807d7',
          'x-amz-request-id': 'txf0b438dfd25b444ba3f60-00641807d7',
          'x-trans-id': 'txf0b438dfd25b444ba3f60-00641807d7',
          'x-openstack-request-id': 'txf0b438dfd25b444ba3f60-00641807d7',
          date: 'Mon, 20 Mar 2023 07:14:31 GMT',
          connection: 'close'
        }

        const nockRequest = nock(url1S3)
          .defaultReplyHeaders(_header)
          .get('/bucket')
          .query({
            "list-type" : 2,
            "prefix"    : "document",
            "max-keys"  : 2
          })
          .reply(200, () => {
            return _listObjectsResponseXML;
          });

        storage.listFiles('bucket', { queries: { "prefix": "document", "max-keys": 2 } }, (err, resp) => {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(JSON.stringify(resp.body), JSON.stringify(_listObjectsResponseJSON));
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_header))
          assert.strictEqual(nockRequest.pendingMocks().length, 0);
          done();
        })
      })

      it("should return an error if the bucket does not exist", function (done) {
        const _headers = {
          'content-type': 'application/xml',
          'x-amz-id-2': 'tx8fa5f00b19af4756b9ef3-0064184d77',
          'x-amz-request-id': 'tx8fa5f00b19af4756b9ef3-0064184d77',
          'x-trans-id': 'tx8fa5f00b19af4756b9ef3-0064184d77',
          'x-openstack-request-id': 'tx8fa5f00b19af4756b9ef3-0064184d77',
          date: 'Mon, 20 Mar 2023 12:11:35 GMT',
          'transfer-encoding': 'chunked',
          connection: 'close'
        }
        const _expectedBody = {
          error: {
            code: 'NoSuchBucket',
            message: 'The specified bucket does not exist.',
            requestid: 'txe285e692106542e88a2f5-0064184e80',
            bucketname: 'buckeeeet'
          }
        }
        const nockRequest = nock(url1S3)
          .defaultReplyHeaders(_headers)
          .get('/buckeeeet')
          .query({
            "list-type" : 2
          })
          .reply(404, () => {
            return "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist.</Message><RequestId>txe285e692106542e88a2f5-0064184e80</RequestId><BucketName>buckeeeet</BucketName></Error>";
          });
        storage.listFiles('buckeeeet', (err, resp) => {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 404);
          assert.strictEqual(JSON.stringify(resp.body), JSON.stringify(_expectedBody));
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_headers))
          assert.strictEqual(nockRequest.pendingMocks().length, 0);
          done();
        })
      })
    });

    describe("SWITCH TO CHILD STORAGE", function () {
      it('should fetch a list of objects', function (done) {
        const nockRequestS1 = nock(url1S3)
          .get('/bucket')
          .query({ 'list-type' : 2 })
          .reply(500, '');

        const nockRequestS2 = nock(url2S3)
          .get('/bucket')
          .query({ 'list-type' : 2 })
          .reply(200, () => {
            return _listObjectsResponseXML;
          });

        const nockRequestS3 = nock(url1S3)
          .get('/')
          .reply(500);

        storage.listFiles('bucket', (err, resp) => {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(JSON.stringify(resp.body), JSON.stringify(_listObjectsResponseJSON));
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify({}))
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS2.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS3.pendingMocks().length, 0);
          done();
        })
      })
    });

  });

  describe('downloadFile', function() {

    describe("REQUEST MAIN STORAGE", function () {
      it('should download a file', function(done) {
        const _header = {
          'content-length': '1492',
          'last-modified': 'Wed, 03 Nov 2021 13:02:39 GMT',
          date: 'Wed, 03 Nov 2021 14:28:48 GMT',
          etag: 'a30776a059eaf26eebf27756a849097d',
          'x-amz-request-id': '318BC8BC148832E5',
          'x-amz-id-2': 'eftixk72aD6Ap51TnqcoF8eFidJG9Z/2mkiDFu8yU9AS1ed4OpIszj7UDNEHGran'
        }
        const nockRequest = nock(url1S3)
          .defaultReplyHeaders(_header)
          .get('/bucket/file.docx')
          .reply(200, () => {
            return fileTxt;
          });
        storage.downloadFile('bucket', 'file.docx', function (err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(resp.body.toString(), fileTxt);
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_header))
          assert.strictEqual(nockRequest.pendingMocks().length, 0);
          done();
        })
      })

      it('should download a file with options', function(done) {
        const _header = {
          'content-length': '1492',
          'last-modified': 'Wed, 03 Nov 2021 13:02:39 GMT',
          date: 'Wed, 03 Nov 2021 14:28:48 GMT',
          etag: 'a30776a059eaf26eebf27756a849097d',
          'x-amz-request-id': '318BC8BC148832E5',
          'x-amz-id-2': 'eftixk72aD6Ap51TnqcoF8eFidJG9Z/2mkiDFu8yU9AS1ed4OpIszj7UDNEHGran'
        }
        const _options = {
          headers: {
            "x-amz-server-side-encryption-customer-key-MD5": "SSECustomerKeyMD5",
            "x-amz-checksum-mode": "ChecksumMode"
          },
          queries: {
            test       : "2",
            partNumber : "PartNumber"
          }
        }
        const nockRequest = nock(url1S3, {
            reqheaders: {
              'x-amz-server-side-encryption-customer-key-MD5': () => true,
              'x-amz-checksum-mode': () => true
            }
          })
          .defaultReplyHeaders(_header)
          .get('/bucket/file.docx')
          .query(_options.queries)
          .reply(200, () => {
            return fileTxt;
          });
        storage.downloadFile('bucket', 'file.docx', _options, function (err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(resp.body.toString(), fileTxt);
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_header))
          assert.strictEqual(nockRequest.pendingMocks().length, 0);
          done();
        })
      })

      it('should return code 404 if the file does not exist', function(done) {
        const _header = {'content-type': 'application/xml'}
        const nockRequest = nock(url1S3)
          .defaultReplyHeaders(_header)
          .get('/bucket/file.docx')
          .reply(404, "<?xml version='1.0' encoding='UTF-8'?><Error><Code>NoSuchKey</Code><Message>The specified key does not exist.</Message><RequestId>txc03d49a36c324653854de-006408d963</RequestId><Key>template222.odt</Key></Error>");
        storage.downloadFile('bucket', 'file.docx', function (err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 404);
          assert.strictEqual(JSON.stringify(resp.body), JSON.stringify({
            error: {
              code: 'NoSuchKey',
              message: 'The specified key does not exist.',
              requestid: 'txc03d49a36c324653854de-006408d963',
              key: 'template222.odt'
            }
          }));
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_header))
          assert.strictEqual(nockRequest.pendingMocks().length, 0);
          done();
        })
      })

      it("should return an error if the bucket does not exist", function (done) {
        const _header = {
          'content-type': 'application/xml',
          'x-amz-id-2': 'txfa644d038be848a9938e3-00641850f0',
          'x-amz-request-id': 'txfa644d038be848a9938e3-00641850f0',
          'x-trans-id': 'txfa644d038be848a9938e3-00641850f0',
          'x-openstack-request-id': 'txfa644d038be848a9938e3-00641850f0',
          date: 'Mon, 20 Mar 2023 12:26:24 GMT',
          'transfer-encoding': 'chunked',
          connection: 'close'
        }
        const nockRequest = nock(url1S3)
          .defaultReplyHeaders(_header)
          .get('/buckeeeet/file.docx')
          .reply(404, () => {
            return "<?xml version='1.0' encoding='UTF-8'?><Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist.</Message><RequestId>txfa644d038be848a9938e3-00641850f0</RequestId><BucketName>buckeeeet</BucketName></Error>";
          });
        storage.downloadFile('buckeeeet', 'file.docx', function (err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 404);
          assert.strictEqual(JSON.stringify(resp.body), JSON.stringify({
            error: {
              code: 'NoSuchBucket',
              message: 'The specified bucket does not exist.',
              requestid: 'txfa644d038be848a9938e3-00641850f0',
              bucketname: 'buckeeeet'
            }
          }));
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_header))
          assert.strictEqual(nockRequest.pendingMocks().length, 0);
          done();
        })
      })
    });

    describe("SWITCH TO CHILD STORAGE", function () {
      it('should download a file from the second storage if the main storage returns a 500 error', function(done) {
        const nockRequestS1 = nock(url1S3)
          .get('/bucket/file.docx')
          .reply(500);
        const nockRequestS2 = nock(url2S3)
          .get('/bucket/file.docx')
          .reply(200, () => {
            return fileTxt
          });
        const nockRequestS3 = nock(url1S3)
          .get('/')
          .reply(500);

        storage.downloadFile('bucket', 'file.docx', function (err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(resp.body.toString(), fileTxt);
          const _config = storage.getConfig();
          assert.strictEqual(_config.activeStorage, 1);
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS2.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS3.pendingMocks().length, 0);
          done();
        })
      })

      it('should download a file from the second storage if the main storage returns a 500 error, then should RECONNECT to the main storage', function(done) {
        const nockRequestS1 = nock(url1S3)
          .get('/bucket/file.docx')
          .reply(500)
        const nockRequestS2 = nock(url2S3)
          .get('/bucket/file.docx')
          .reply(200, () => {
            return fileTxt
          });
        const nockRequestS3 = nock(url1S3)
          .get('/')
          .reply(200);

        storage.downloadFile('bucket', 'file.docx', function (err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(resp.body.toString(), fileTxt);
          const _config = storage.getConfig();
          assert.strictEqual(_config.activeStorage, 0);
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS2.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS3.pendingMocks().length, 0);
          done();
        })
      })

      it('should download a file from the second storage if the authentication on the main storage is not allowed', function(done) {
        let nockRequestS1 = nock(url1S3)
          .get('/bucket/file.docx')
          .reply(401, 'Unauthorized')

        const nockRequestS2 = nock(url2S3)
          .get('/bucket/file.docx')
          .reply(200, () => {
            return fileTxt
          });
        const nockRequestS3 = nock(url1S3)
          .get('/')
          .reply(401, 'Unauthorized')

        storage.downloadFile('bucket', 'file.docx', function (err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(resp.body.toString(), fileTxt);
          const _config = storage.getConfig();
          assert.strictEqual(_config.activeStorage, 1);
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS2.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS3.pendingMocks().length, 0);
          done();
        })
      })

      it('should download a file from the second storage if the main storage timeout', function(done) {
        storage.setTimeout(200);
        let nockRequestS1 = nock(url1S3)
          .get('/bucket/file.docx')
          .delayConnection(500)
          .reply(200, {});
        const nockRequestS2 = nock(url2S3)
          .get('/bucket/file.docx')
          .reply(200, () => {
            return fileTxt
          });
        const nockRequestS3 = nock(url1S3)
          .get('/')
          .delayConnection(500)
          .reply(200, {});

        storage.downloadFile('bucket', 'file.docx', function (err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(resp.body.toString(), fileTxt);
          const _config = storage.getConfig();
          assert.strictEqual(_config.activeStorage, 1);
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS2.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS3.pendingMocks().length, 0);
          done();
        })
      })

      it('should download a file from the second storage if the main storage returns any kind of error', function(done) {
        let nockRequestS1 = nock(url1S3)
          .get('/bucket/file.docx')
          .replyWithError('Error Message 1234');

        const nockRequestS2 = nock(url2S3)
          .get('/bucket/file.docx')
          .reply(200, () => {
            return fileTxt
          });
        const nockRequestS3 = nock(url1S3)
          .get('/')
          .replyWithError('Error Message 1234');

        storage.downloadFile('bucket', 'file.docx', function (err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(resp.body.toString(), fileTxt);
          const _config = storage.getConfig();
          assert.strictEqual(_config.activeStorage, 1);
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS2.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS3.pendingMocks().length, 0);
          done();
        })
      })

      it('should return an error if all storage are not available, and reset the active storage to the main', function(done) {
        const nockRequestS1 = nock(url1S3)
          .get('/bucket/file.docx')
          .reply(500)
        const nockRequestS2 = nock(url2S3)
          .get('/bucket/file.docx')
          .reply(500, () => {
            return fileTxt
          });
        const nockRequestS3 = nock(url1S3)
          .get('/')
          .reply(500);

        storage.downloadFile('bucket', 'file.docx', function (err, resp) {
          assert.strictEqual(err.toString(), 'Error: All S3 storages are not available');
          assert.strictEqual(resp, undefined);
          const _config = storage.getConfig();
          assert.strictEqual(_config.activeStorage, 0);
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS2.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS3.pendingMocks().length, 0);
          done();
        })
      })
    });

    describe("PARALLEL REQUESTS", function () {

      function getDownloadFilePromise() {
        return new Promise((resolve, reject) => {
          try {
            storage.downloadFile('bucket', 'file.odt', function (err, resp) {
              if (err) {
                return reject(err);
              }
              return resolve(resp);
            });
          } catch(err) {
            return reject(err);
          }
        });
      }

      it('should fallback to a child if the main storage return any kind of errors, then should reconnect to the main storage automatically', function (done) {
        const nockRequestS1 = nock(url1S3)
          .get('/bucket/file.odt')
          .reply(500)
          .get('/bucket/file.odt')
          .reply(500);
        const nockRequestS2 = nock(url2S3)
          .get('/bucket/file.odt')
          .reply(200, () => {
            return fileTxt
          })
          .get('/bucket/file.odt')
          .reply(200, () => {
            return fileTxt
          });
        const nockRequestS3 = nock(url1S3)
          .get('/')
          .reply(200);
        const nockRequestS4 = nock(url1S3)
          .get('/bucket/file.odt')
          .reply(200, () => {
            return fileTxt
          })

        let promise1 = getDownloadFilePromise()
        let promise2 = getDownloadFilePromise()

        Promise.all([promise1, promise2]).then(results => {
          assert.strictEqual(results.length, 2)
          assert.strictEqual(results[0].body.toString(), fileTxt);
          assert.strictEqual(results[0].statusCode, 200);
          assert.strictEqual(results[1].body.toString(), fileTxt);
          assert.strictEqual(results[1].statusCode, 200);
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS2.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS3.pendingMocks().length, 0);
          assert.deepStrictEqual(storage.getConfig().activeStorage, 0);
          /** Last batch requesting the main storage, everything is ok */
          storage.downloadFile('bucket', 'file.odt', function (err, resp) {
            assert.strictEqual(err, null);
            assert.strictEqual(resp.body.toString(), fileTxt);
            assert.strictEqual(resp.statusCode, 200);
            assert.strictEqual(nockRequestS4.pendingMocks().length, 0);
            assert.deepStrictEqual(storage.getConfig().activeStorage, 0);
            done();
          });
        }).catch(err => {
          assert.strictEqual(err, null);
          done();
        });
      })

      it('should fallback to a child if the main storage return any kind of errors, then should reconnect to the main storage after multiple try', function (done) {
        /** First Batch */
        const nockRequestS1 = nock(url1S3)
          .get('/bucket/file.odt')
          .reply(500)
          .get('/bucket/file.odt')
          .reply(500);
        const nockRequestS2 = nock(url2S3)
          .get('/bucket/file.odt')
          .reply(200, () => {
            return fileTxt
          })
          .get('/bucket/file.odt')
          .reply(200, () => {
            return fileTxt
          });
        const nockRequestS3 = nock(url1S3)
          .get('/')
          .reply(500);

        /** Second Batch */
        const nockRequestS4 = nock(url2S3)
          .get('/bucket/file.odt')
          .reply(200, () => {
            return fileTxt
          })
          .get('/bucket/file.odt')
          .reply(200, () => {
            return fileTxt
          });
        const nockRequestS5 = nock(url1S3)
          .get('/')
          .reply(500);

        /** Third Batch */
        const nockRequestS6 = nock(url2S3)
          .get('/bucket/file.odt')
          .reply(200, () => {
            return fileTxt
          })
        const nockRequestS7 = nock(url1S3)
          .get('/')
          .reply(200);
        /** Fourth Batch */
        const nockRequestS8 = nock(url1S3)
          .get('/bucket/file.odt')
          .reply(200, () => {
            return fileTxt
          })

        /** First batch of requests > S3 main return error > Child storage response ok */
        let promise1 = getDownloadFilePromise()
        let promise2 = getDownloadFilePromise()
        Promise.all([promise1, promise2]).then(function (results) {
          assert.strictEqual(results.length, 2)
          assert.strictEqual(results[0].body.toString(), fileTxt);
          assert.strictEqual(results[0].statusCode, 200);
          assert.strictEqual(results[1].body.toString(), fileTxt);
          assert.strictEqual(results[1].statusCode, 200);
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS2.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS3.pendingMocks().length, 0);
          assert.deepStrictEqual(storage.getConfig().activeStorage, 1);
          /** Second batch of requests > Still requesting the child storage, the main storage is still not available  */
          let promise3 = getDownloadFilePromise()
          let promise4 = getDownloadFilePromise()
          Promise.all([promise3, promise4]).then(function (results) {
            assert.strictEqual(results.length, 2)
            assert.strictEqual(results[0].body.toString(), fileTxt);
            assert.strictEqual(results[0].statusCode, 200);
            assert.strictEqual(results[1].body.toString(), fileTxt);
            assert.strictEqual(results[1].statusCode, 200);
            assert.strictEqual(nockRequestS4.pendingMocks().length, 0);
            assert.strictEqual(nockRequestS5.pendingMocks().length, 0);
            assert.deepStrictEqual(storage.getConfig().activeStorage, 1);
            /** Third batch of requests >  Still requesting the child storage, the main storage is now Available! Active storage is reset to the main storage  */
            storage.downloadFile('bucket', 'file.odt', function (err, resp) {
              assert.strictEqual(err, null);
              assert.strictEqual(resp.body.toString(), fileTxt);
              assert.strictEqual(resp.statusCode, 200);
              assert.strictEqual(nockRequestS6.pendingMocks().length, 0);
              assert.strictEqual(nockRequestS7.pendingMocks().length, 0);
              assert.deepStrictEqual(storage.getConfig().activeStorage, 0);
              /** Fourth batch requesting the main storage, everything is ok */
              storage.downloadFile('bucket', 'file.odt', function (err, resp) {
                assert.strictEqual(err, null);
                assert.strictEqual(resp.body.toString(), fileTxt);
                assert.strictEqual(resp.statusCode, 200);
                assert.strictEqual(nockRequestS8.pendingMocks().length, 0);
                assert.deepStrictEqual(storage.getConfig().activeStorage, 0);
                done();
              });
            });
          }).catch(function (err) {
            assert.strictEqual(err, null);
            done();
          });
        }).catch(function (err) {
          assert.strictEqual(err, null);
          done();
        });
      })

    });

  });

  describe('uploadFile', function() {

    describe("REQUEST MAIN STORAGE", function () {
      const _header = {
        'content-length': '0',
        'last-modified': 'Wed, 03 Nov 2021 13:02:39 GMT',
        date: 'Wed, 03 Nov 2021 14:28:48 GMT',
        etag: 'a30776a059eaf26eebf27756a849097d',
        'x-amz-request-id': '318BC8BC148832E5',
        'x-amz-id-2': 'eftixk72aD6Ap51TnqcoF8eFidJG9Z/2mkiDFu8yU9AS1ed4OpIszj7UDNEHGran'
      }

      it("should upload a file provided as buffer", function() {

        const nockRequestS1 = nock(url1S3)
          .defaultReplyHeaders(_header)
          .put('/bucket/file.pdf')
          .reply(200, (uri, requestBody) => {
            assert.strictEqual(requestBody, fileXml);
            return '';
          });

        storage.uploadFile('bucket', 'file.pdf', Buffer.from(fileXml), function(err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_header));
          assert.strictEqual(resp.body.toString(), '');
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
        })
      })

      it("should upload a file provided as local path", function() {

        const nockRequestS1 = nock(url1S3)
          .defaultReplyHeaders(_header)
          .put('/bucket/file.pdf')
          .reply(200, (uri, requestBody) => {
            assert.strictEqual(requestBody, fileXml);
            return '';
          });

        storage.uploadFile('bucket', 'file.pdf', fileXmlPath, function(err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_header));
          assert.strictEqual(resp.body.toString(), '');
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
        })
      })

      it("should upload a file provided as buffer with OPTIONS (like metadata)", function(done) {
        const _options = {
          headers: {
            "x-amz-meta-name": "carbone",
            "x-amz-checksum-sha256": "0ea4be78f6c3948588172edc6d8789ffe3cec461f385e0ac447e581731c429b5"
          },
          queries: {
            test : "2"
          }
        }

        const nockRequestS1 = nock(url1S3,  {
            reqheaders: {
              'x-amz-content-sha256': () => true,
              'x-amz-date': () => true,
              'authorization': () => true,
              'host': () => true,
              'x-amz-meta-name': () => true,
              'x-amz-checksum-sha256': () => true
            }
          })
          .defaultReplyHeaders(_header)
          .put('/bucket/file.pdf')
          .query(_options.queries)
          .reply(200, (uri, requestBody) => {
            assert.strictEqual(requestBody, fileXml);
            return '';
          });


        storage.uploadFile('bucket', 'file.pdf', Buffer.from(fileXml), _options, function(err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_header));
          assert.strictEqual(resp.body.toString(), '');
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          done();
        })
      })

      it("should return an error if the bucket does not exist", function (done) {

        const _headers = {
          'content-type': 'application/xml',
          'x-amz-id-2': 'tx33e4496c9d8746ad9cfcb-006418540f',
          'x-amz-request-id': 'tx33e4496c9d8746ad9cfcb-006418540f',
          'x-trans-id': 'tx33e4496c9d8746ad9cfcb-006418540f',
          'x-openstack-request-id': 'tx33e4496c9d8746ad9cfcb-006418540f',
          date: 'Mon, 20 Mar 2023 12:39:43 GMT',
          'transfer-encoding': 'chunked',
          connection: 'close'
        }

        const nockRequestS1 = nock(url1S3)
          .defaultReplyHeaders(_headers)
          .put('/buckeeeet/file.pdf')
          .reply(404, (uri, requestBody) => {
            assert.strictEqual(requestBody, fileXml);
            return Buffer.from("<?xml version='1.0' encoding='UTF-8'?><Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist.</Message><RequestId>tx9d1553e8d8de401bb8949-00641851bd</RequestId><BucketName>buckeeeet</BucketName></Error>");
          });

        storage.uploadFile('buckeeeet', 'file.pdf', fileXmlPath, function(err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 404);
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_headers));
          assert.strictEqual(JSON.stringify(resp.body), JSON.stringify({
            error: {
              code: 'NoSuchBucket',
              message: 'The specified bucket does not exist.',
              requestid: 'tx9d1553e8d8de401bb8949-00641851bd',
              bucketname: 'buckeeeet'
            }
          }));
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          done();
        })
      })

    });

    describe("SWITCH TO CHILD STORAGE", function () {

      it("should upload a file into a child storage", function(done) {
        const _header = {
          'content-type': 'application/xml',
          'x-amz-id-2': 'txd14fbe8bc05341c0b548a-00640b2752',
          'x-amz-request-id': 'txd14fbe8bc05341c0b548a-00640b2752',
          'x-trans-id': 'txd14fbe8bc05341c0b548a-00640b2752',
          'x-openstack-request-id': 'txd14fbe8bc05341c0b548a-00640b2752',
          date: 'Fri, 10 Mar 2023 12:49:22 GMT',
          'transfer-encoding': 'chunked',
          connection: 'close'
        }

        const nockRequestS1 = nock(url1S3)
          .defaultReplyHeaders(_header)
          .put('/bucket/file.pdf')
          .reply(500, '');

        const nockRequestS2 = nock(url2S3)
          .defaultReplyHeaders(_header)
          .put('/bucket/file.pdf')
          .reply(200, (uri, requestBody) => {
            assert.strictEqual(requestBody, fileXml);
            return '';
          });
        const nockRequestS3 = nock(url1S3)
          .get('/')
          .reply(500);

        storage.uploadFile('bucket', 'file.pdf', Buffer.from(fileXml), function(err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(resp.body.toString(), '');
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_header));
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS2.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS3.pendingMocks().length, 0);
          done();
        })
      })

      it("should not be able to upload a file into a child storage if the write access is denied.", function(done) {
        const _header = {
          'content-type': 'application/xml',
          'x-amz-id-2': 'txd14fbe8bc05341c0b548a-00640b2752',
          'x-amz-request-id': 'txd14fbe8bc05341c0b548a-00640b2752',
          'x-trans-id': 'txd14fbe8bc05341c0b548a-00640b2752',
          'x-openstack-request-id': 'txd14fbe8bc05341c0b548a-00640b2752',
          date: 'Fri, 10 Mar 2023 12:49:22 GMT',
          'transfer-encoding': 'chunked',
          connection: 'close'
        }

        const nockRequestS1 = nock(url1S3)
          .defaultReplyHeaders(_header)
          .put('/bucket/file.pdf')
          .reply(500, '');

        const nockRequestS2 = nock(url2S3)
          .defaultReplyHeaders(_header)
          .put('/bucket/file.pdf')
          .reply(403, () => {
            return "<?xml version='1.0' encoding='UTF-8'?><Error><Code>AccessDenied</Code><Message>Access Denied.</Message><RequestId>txd14fbe8bc05341c0b548a-00640b2752</RequestId></Error>";
          })
        const nockRequestS3 = nock(url1S3)
          .get('/')
          .reply(500);

        const _expectedBody = {
          error: {
            code: 'AccessDenied',
            message: 'Access Denied.',
            requestid: 'txd14fbe8bc05341c0b548a-00640b2752'
          }
        }

        storage.uploadFile('bucket', 'file.pdf', Buffer.from(fileXml), function(err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 403);
          assert.strictEqual(JSON.stringify(resp.body), JSON.stringify(_expectedBody));
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_header));
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS2.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS3.pendingMocks().length, 0);
          done();
        })
      })

    });

  });

  describe('deleteFile', function() {

    describe("REQUEST MAIN STORAGE", function () {

      it('should delete an object (return the same response if the object does not exist)', function(done) {
        const _headers = {
          'content-type': 'text/html; charset=UTF-8',
          'content-length': '0',
          'x-amz-id-2': 'txf010ba580ff0471ba3a0b-0064181698',
          'x-amz-request-id': 'txf010ba580ff0471ba3a0b-0064181698',
          'x-trans-id': 'txf010ba580ff0471ba3a0b-0064181698',
          'x-openstack-request-id': 'txf010ba580ff0471ba3a0b-0064181698',
          date: 'Mon, 20 Mar 2023 08:17:29 GMT',
          connection: 'close'
        }

        const nockRequestS1 = nock(url1S3)
          .defaultReplyHeaders(_headers)
          .delete('/www/file.pdf')
          .reply(204, '');

        storage.deleteFile('www', 'file.pdf', (err, resp) => {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 204);
          assert.strictEqual(resp.body.toString(), '');
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_headers));
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          done();
        })
      })

      it("should return an error if the bucket does not exist", function (done) {
        const _headers = {
          'content-type': 'application/xml',
          'x-amz-id-2': 'tx424f2a5a6e684da581e77-0064185482',
          'x-amz-request-id': 'tx424f2a5a6e684da581e77-0064185482',
          'x-trans-id': 'tx424f2a5a6e684da581e77-0064185482',
          'x-openstack-request-id': 'tx424f2a5a6e684da581e77-0064185482',
          date: 'Mon, 20 Mar 2023 12:41:38 GMT',
          'transfer-encoding': 'chunked',
          connection: 'close'
        }

        const nockRequestS1 = nock(url1S3)
          .defaultReplyHeaders(_headers)
          .delete('/buckeeet/file.pdf')
          .reply(404, "<?xml version='1.0' encoding='UTF-8'?><Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist.</Message><RequestId>tx424f2a5a6e684da581e77-0064185482</RequestId><BucketName>buckeeet</BucketName></Error>");

        storage.deleteFile('buckeeet', 'file.pdf', (err, resp) => {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 404);
          assert.strictEqual(JSON.stringify(resp.body), JSON.stringify({
            error: {
              code: 'NoSuchBucket',
              message: 'The specified bucket does not exist.',
              requestid: 'tx424f2a5a6e684da581e77-0064185482',
              bucketname: 'buckeeet'
            }
          }));
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_headers));
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          done();
        })
      })

    });

    describe("SWITCH TO CHILD STORAGE", function () {

      it('should delete an object from the second bucket', function(done) {
        const _headers = {
          'content-type': 'text/html; charset=UTF-8',
          'content-length': '0',
          'x-amz-id-2': 'txf010ba580ff0471ba3a0b-0064181698',
          'x-amz-request-id': 'txf010ba580ff0471ba3a0b-0064181698',
          'x-trans-id': 'txf010ba580ff0471ba3a0b-0064181698',
          'x-openstack-request-id': 'txf010ba580ff0471ba3a0b-0064181698',
          date: 'Mon, 20 Mar 2023 08:17:29 GMT',
          connection: 'close'
        }

        const nockRequestS1 = nock(url1S3)
          .delete('/www/file.pdf')
          .reply(500, '');

        const nockRequestS2 = nock(url2S3)
          .defaultReplyHeaders(_headers)
          .delete('/www/file.pdf')
          .reply(204, '');

        const nockRequestS3 = nock(url1S3)
          .get('/')
          .reply(500, '');

        storage.deleteFile('www', 'file.pdf', (err, resp) => {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 204);
          assert.strictEqual(resp.body.toString(), '');
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_headers));
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS2.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS3.pendingMocks().length, 0);
          done();
        })
      })

      it("should not be able to delete a file of a child storage if the write permission is disallowed", function(done) {
        const _bodyErrorAccessDenied = "<?xml version='1.0' encoding='UTF-8'?><Error><Code>AccessDenied</Code><Message>Access Denied.</Message><RequestId>txb40580debedc4ff9b36dc-00641818cb</RequestId></Error>"
        const _bodyJson = {
          error: {
            code: 'AccessDenied',
            message: 'Access Denied.',
            requestid: 'txb40580debedc4ff9b36dc-00641818cb'
          }
        }

        const _headers = {
          'content-type': 'application/xml',
          'x-amz-id-2': 'txb40580debedc4ff9b36dc-00641818cb',
          'x-amz-request-id': 'txb40580debedc4ff9b36dc-00641818cb',
          'x-trans-id': 'txb40580debedc4ff9b36dc-00641818cb',
          'x-openstack-request-id': 'txb40580debedc4ff9b36dc-00641818cb',
          date: 'Mon, 20 Mar 2023 08:26:51 GMT',
          'transfer-encoding': 'chunked',
          connection: 'close'
        }

        const nockRequestS1 = nock(url1S3)
          .delete('/www/file.pdf')
          .reply(500, '');

        const nockRequestS2 = nock(url2S3)
          .defaultReplyHeaders(_headers)
          .delete('/www/file.pdf')
          .reply(403, _bodyErrorAccessDenied);

        const nockRequestS3 = nock(url1S3)
          .get('/')
          .reply(500, '');

        storage.deleteFile('www', 'file.pdf', (err, resp) => {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 403);
          assert.strictEqual(JSON.stringify(resp.body), JSON.stringify(_bodyJson));
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_headers));
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS2.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS3.pendingMocks().length, 0);
          done();
        })
      })

    });

  });

  describe('deleteFiles', function() {

    describe("REQUEST MAIN STORAGE", function () {

      it('should delete a list of objects', function(done) {
        const _headers = {
          'content-type': 'text/html; charset=UTF-8',
          'content-length': '269',
          'x-amz-id-2': 'txb383f29c0dad46f9919b5-00641844ba',
          'x-amz-request-id': 'txb383f29c0dad46f9919b5-00641844ba',
          'x-trans-id': 'txb383f29c0dad46f9919b5-00641844ba',
          'x-openstack-request-id': 'txb383f29c0dad46f9919b5-00641844ba',
          date: 'Mon, 20 Mar 2023 11:34:18 GMT',
          connection: 'close'
        }

        const _filesToDelete = [
          { key: 'invoice 2023.pdf' },
          { key: 'carbone(1).png' },
          { key: 'file.txt' }
        ]

        const _expectedBody = {
          deleted: _filesToDelete.map((value) => {
            return {
              key: encodeURIComponent(value.key)
            }
          })
        }

        const nockRequestS1 = nock(url1S3)
          .defaultReplyHeaders(_headers)
          .post('/www/')
          .query((actualQueryObject) => {
            assert.strictEqual(actualQueryObject.delete !== undefined, true);
            return true;
          })
          .reply(200, function(uri, body) {
            console.log(uri, body);
            return "<?xml version=\"1.0\" encoding=\"UTF-8\"?><DeleteResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\"><Deleted><Key>invoice%202023.pdf</Key></Deleted><Deleted><Key>carbone(1).png</Key></Deleted><Deleted><Key>file.txt</Key></Deleted></DeleteResult>";
          })

        storage.deleteFiles('www', _filesToDelete, (err, resp) => {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(JSON.stringify(resp.body), JSON.stringify(_expectedBody));
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_headers));
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          done();
        })
      })

      it('should delete a list of objects with mix success/errors (access denied)', function(done) {
        const _headers = {
          'content-type': 'text/html; charset=UTF-8',
          'content-length': '269',
          'x-amz-id-2': 'tx3cf216266bf24a888354a-0064184a78',
          'x-amz-request-id': 'tx3cf216266bf24a888354a-0064184a78',
          'x-trans-id': 'tx3cf216266bf24a888354a-0064184a78',
          'x-openstack-request-id': 'tx3cf216266bf24a888354a-0064184a78',
          date: 'Mon, 20 Mar 2023 11:58:49 GMT',
          connection: 'close'
        }

        const _filesToDelete = [
          { key: 'sample1.txt' },
          { key: 'sample2.txt' }
        ]

        const _expectedBody = {
          deleted: [
            { key: 'sample1.txt' }
          ],
          error: [
            {
              key    : 'sample2.txt',
              code   : 'AccessDenied',
              message: 'Access Denied'
            }
          ]
        }

        const nockRequestS1 = nock(url1S3)
          .defaultReplyHeaders(_headers)
          .post('/www/')
          .query((actualQueryObject) => {
            assert.strictEqual(actualQueryObject.delete !== undefined, true);
            return true;
          })
          .reply(200, function(uri, body) {
            console.log(uri, body);
            return "<?xml version=\"1.0\" encoding=\"UTF-8\"?><DeleteResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\"><Deleted><Key>sample1.txt</Key></Deleted><Error><Key>sample2.txt</Key><Code>AccessDenied</Code><Message>Access Denied</Message></Error></DeleteResult>";
          })

        storage.deleteFiles('www', _filesToDelete, (err, resp) => {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(JSON.stringify(resp.body), JSON.stringify(_expectedBody));
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_headers));
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          done();
        })
      })

      it("should return an error if the bucket does not exist", function (done) {
        const _headers = {
          'content-type': 'application/xml',
          'x-amz-id-2': 'tx84736ac6d5544b44ba91a-0064185021',
          'x-amz-request-id': 'tx84736ac6d5544b44ba91a-0064185021',
          'x-trans-id': 'tx84736ac6d5544b44ba91a-0064185021',
          'x-openstack-request-id': 'tx84736ac6d5544b44ba91a-0064185021',
          date: 'Mon, 20 Mar 2023 12:22:57 GMT',
          'transfer-encoding': 'chunked',
          connection: 'close'
        }

        const _filesToDelete = [
          { key: 'invoice 2023.pdf' },
          { key: 'carbone(1).png' },
          { key: 'file.txt' }
        ]

        const _expectedBody = {
          error: {
            code: 'NoSuchBucket',
            message: 'The specified bucket does not exist.',
            requestid: 'tx84736ac6d5544b44ba91a-0064185021',
            bucketname: 'buckeeeet'
          }
        }

        const nockRequestS1 = nock(url1S3)
          .defaultReplyHeaders(_headers)
          .post('/buckeeeet/')
          .query((actualQueryObject) => {
            assert.strictEqual(actualQueryObject.delete !== undefined, true);
            return true;
          })
          .reply(404, function(uri, body) {
            console.log(uri, body);
            return "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist.</Message><RequestId>tx84736ac6d5544b44ba91a-0064185021</RequestId><BucketName>buckeeeet</BucketName></Error>";
          })

        storage.deleteFiles('buckeeeet', _filesToDelete, (err, resp) => {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 404);
          assert.strictEqual(JSON.stringify(resp.body), JSON.stringify(_expectedBody));
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_headers));
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          done();
        })
      })


    });

    describe("SWITCH TO CHILD STORAGE", function () {

      it("should not be able to delete a file of a child storage if the write permission is disallowed (access denied)", function(done) {
        const _headers = {
          'content-type': 'text/html; charset=UTF-8',
          'content-length': '431',
          'x-amz-id-2': 'txe69b17ed1cf04260b9090-0064184b17',
          'x-amz-request-id': 'txe69b17ed1cf04260b9090-0064184b17',
          'x-trans-id': 'txe69b17ed1cf04260b9090-0064184b17',
          'x-openstack-request-id': 'txe69b17ed1cf04260b9090-0064184b17',
          date: 'Mon, 20 Mar 2023 12:01:28 GMT',
          connection: 'close'
        }

        const _filesToDelete = [
          { key: 'invoice 2023.pdf' },
          { key: 'carbone(1).png' },
          { key: 'file.txt' }
        ]

        const _expectedBody = {
          error: _filesToDelete.map((value) => {
            return {
              key    : encodeURIComponent(value.key),
              code   : 'AccessDenied',
              message: 'Access Denied'
            }
          })
        }

        const nockRequestS1 = nock(url1S3)
          .post('/www/')
          .query((actualQueryObject) => {
            assert.strictEqual(actualQueryObject.delete !== undefined, true);
            return true;
          })
          .reply(500, '')

        const nockRequestS2 = nock(url2S3)
          .defaultReplyHeaders(_headers)
          .post('/www/')
          .query((actualQueryObject) => {
            assert.strictEqual(actualQueryObject.delete !== undefined, true);
            return true;
          })
          .reply(200, function(uri, body) {
            console.log(uri, body);
            return "<?xml version=\"1.0\" encoding=\"UTF-8\"?><DeleteResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\"><Error><Key>invoice%202023.pdf</Key><Code>AccessDenied</Code><Message>Access Denied</Message></Error><Error><Key>carbone(1).png</Key><Code>AccessDenied</Code><Message>Access Denied</Message></Error><Error><Key>file.txt</Key><Code>AccessDenied</Code><Message>Access Denied</Message></Error></DeleteResult>";
          })
        const nockRequestS3 = nock(url1S3)
          .get('/')
          .reply(500, '');

        storage.deleteFiles('www', _filesToDelete, (err, resp) => {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(JSON.stringify(resp.body), JSON.stringify(_expectedBody));
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_headers));
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS2.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS3.pendingMocks().length, 0);
          done();
        })
      })

    });

  });

  describe('getFileMetadata', function() {

    describe("REQUEST MAIN STORAGE", function () {

      it('should get file metadata', function(done){
        const _headers = {
          'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
          'content-length': '11822',
          'x-amz-storage-class': 'STANDARD',
          'x-amz-meta-name': 'Carbone.io',
          'x-amz-meta-version': '858585',
          etag: '"fde6d729123cee4db6bfa3606306bc8c"',
          'x-amz-version-id': '1679316796.606606',
          'last-modified': 'Mon, 20 Mar 2023 12:53:16 GMT',
          'x-amz-id-2': 'txd2aa2b0a02554657b5efe-0064185752',
          'x-amz-request-id': 'txd2aa2b0a02554657b5efe-0064185752',
          'x-trans-id': 'txd2aa2b0a02554657b5efe-0064185752',
          'x-openstack-request-id': 'txd2aa2b0a02554657b5efe-0064185752',
          date: 'Mon, 20 Mar 2023 12:53:38 GMT',
          connection: 'close'
        }

        const nockRequestS1 = nock(url1S3)
          .defaultReplyHeaders(_headers)
          .intercept("/bucket/file.pdf", "HEAD")
          .reply(200, "");

        storage.getFileMetadata('bucket', 'file.pdf', function(err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(resp.body.toString(), '');
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_headers));
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          done();
        });
      })

      it('should return an error if the object or bucket don\'t exist', function(done){
        const _headers = {
          'content-type': 'application/xml',
          'x-amz-id-2': 'tx10b87fee8896442cb93ce-00641855ea',
          'x-amz-request-id': 'tx10b87fee8896442cb93ce-00641855ea',
          'x-trans-id': 'tx10b87fee8896442cb93ce-00641855ea',
          'x-openstack-request-id': 'tx10b87fee8896442cb93ce-00641855ea',
          date: 'Mon, 20 Mar 2023 12:47:38 GMT',
          connection: 'close'
        }

        const nockRequestS1 = nock(url1S3)
          .defaultReplyHeaders(_headers)
          .intercept("/bucket/file.pdf", "HEAD")
          .reply(404, "");

        storage.getFileMetadata('bucket', 'file.pdf', function(err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 404);
          assert.strictEqual(JSON.stringify(resp.body), JSON.stringify({}));
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_headers));
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          done();
        });
      })
    });

    describe("SWITCH TO CHILD STORAGE", function () {

      it.only('should get file metadata in the second storage', function(done){
        const _headers = {
          'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
          'content-length': '11822',
          'x-amz-storage-class': 'STANDARD',
          'x-amz-meta-name': 'Carbone.io',
          'x-amz-meta-version': '858585',
          etag: '"fde6d729123cee4db6bfa3606306bc8c"',
          'x-amz-version-id': '1679316796.606606',
          'last-modified': 'Mon, 20 Mar 2023 12:53:16 GMT',
          'x-amz-id-2': 'txd2aa2b0a02554657b5efe-0064185752',
          'x-amz-request-id': 'txd2aa2b0a02554657b5efe-0064185752',
          'x-trans-id': 'txd2aa2b0a02554657b5efe-0064185752',
          'x-openstack-request-id': 'txd2aa2b0a02554657b5efe-0064185752',
          date: 'Mon, 20 Mar 2023 12:53:38 GMT',
          connection: 'close'
        }

        const nockRequestS1 = nock(url1S3)
          .intercept("/bucket/file.pdf", "HEAD")
          .reply(500, "");

        const nockRequestS2 = nock(url2S3)
          .defaultReplyHeaders(_headers)
          .intercept("/bucket/file.pdf", "HEAD")
          .reply(200, "");

        const nockRequestS3 = nock(url1S3)
          .get('/')
          .reply(500, '');

        storage.getFileMetadata('bucket', 'file.pdf', function(err, resp) {
          assert.strictEqual(err, null);
          assert.strictEqual(resp.statusCode, 200);
          assert.strictEqual(resp.body.toString(), '');
          assert.strictEqual(JSON.stringify(resp.headers), JSON.stringify(_headers));
          assert.strictEqual(nockRequestS1.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS2.pendingMocks().length, 0);
          assert.strictEqual(nockRequestS3.pendingMocks().length, 0);
          done();
        });
      })

    });

  });


  describe('setFileMetadata', function() {

    describe("REQUEST MAIN STORAGE", function () {

      it.skip('should set file metadata', function(done){

      })


      it.skip('should return an error if the file metadata is greater than 2KB', function(done){

      })

      it.skip('should return an error if the object does not exist', function(done){

      })

      it.skip('should return an error if the bucket does not exist', function(done){

      })

    });

    describe("SWITCH TO CHILD STORAGE", function () {

      it.skip('should set file metadata in the child storage', function(done){

      })

      it.skip("should not be able to write file metadata of a child storage if the write permission is disallowed", function(done) {

      })

    });

  });

});