import axios from 'axios';

const MELHOR_ENVIO_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NTYiLCJqdGkiOiI1MTdmNjY5YjBiZDg0ZTY3M2E4ZmFlODBiMzQzM2FlMDM5NWFkZWJiZTNkMjEzOTA4NTA4MDNkNmExYzg4OGE5MmViNzM1MTQ1M2IzOGU3OSIsImlhdCI6MTc2NjcwNDI2NS4xMzkyLCJuYmYiOjE3NjY3MDQyNjUuMTM5MjAyLCJleHAiOjE3OTgyNDAyNjUuMTMwNjQxLCJzdWIiOiJhMGEzNWY2Mi1jYzBmLTQ1ODktYThiYS02MzZkYjhjY2VlNzciLCJzY29wZXMiOlsiY2FydC1yZWFkIiwiY2FydC13cml0ZSIsImNvbXBhbmllcy1yZWFkIiwiY29tcGFuaWVzLXdyaXRlIiwiY291cG9ucy1yZWFkIiwiY291cG9ucy13cml0ZSIsIm5vdGlmaWNhdGlvbnMtcmVhZCIsIm9yZGVycy1yZWFkIiwicHJvZHVjdHMtcmVhZCIsInByb2R1Y3RzLWRlc3Ryb3kiLCJwcm9kdWN0cy13cml0ZSIsInB1cmNoYXNlcy1yZWFkIiwic2hpcHBpbmctY2FsY3VsYXRlIiwic2hpcHBpbmctY2FuY2VsIiwic2hpcHBpbmctY2hlY2tvdXQiLCJzaGlwcGluZy1jb21wYW5pZXMiLCJzaGlwcGluZy1nZW5lcmF0ZSIsInNoaXBwaW5nLXByZXZpZXciLCJzaGlwcGluZy1wcmludCIsInNoaXBwaW5nLXNoYXJlIiwic2hpcHBpbmctdHJhY2tpbmciLCJlY29tbWVyY2Utc2hpcHBpbmciLCJ0cmFuc2FjdGlvbnMtcmVhZCIsInVzZXJzLXJlYWQiLCJ1c2Vycy13cml0ZSIsIndlYmhvb2tzLXJlYWQiLCJ3ZWJob29rcy13cml0ZSIsIndlYmhvb2tzLWRlbGV0ZSIsInRkZWFsZXItd2ViaG9vayJdfQ.ksVt_m5tW1dAeoA2MTX8BVepk42I7KIezS5Fr6yIZBHnH-g-a42N9MDZupJ2gM8cbwV5GDFSmo7OY3BNXy35Cczd23b5B3Ui6XtLR_fo65x-kYiPxl9KM9o3hRyoUk5GktSeFSud8HSQzNtA1kthenLN4l4VTBFx42QfbF1UMJ_o7nXPgNnklYF2QTSuZvKCFQ-WsMVM4g5MGxAGdE2bCbYKGBdN79Lp3WJVXQdt6Md1LFbbcj_--ai7ofRxRTNU_twmAfbVxVMl8gJ0leDcahYIUtoKvGEb_zVh35dQ-tqc9N2UYPIUTebzKysA-_7JmnQW513k7nUSa1eU_dZPsNx-t0z36qozdpS_rwK-gsNoQNEGm8yjt4QtXEmV2DuS9pRlh6v705cdzU3nHA-zJIj9t82ofrfm0M-LbPqZQYiDSNdO1QAqy2FafrubsSrdt5CDdcOfbZhzboqZS8d8Sh_nFmhTyWC109kHbCo3NGGUwwL_4D4w_M7Gc5_yCv8VzOKUHGq7FBbMLMMqBy1DTUSYqKnQWF68G0URZQXBw-FMEEDPM8H7gksXDp_XUKnEMzalDCFjVK6cAR4INYqWSzS-XEtHvu4nhWjLUczWj9Kkb4M6sOk_DeuqXVcJd5aPXxQXItC5OvN7eCGlY3UB8-ueZAcalYH1E6PX5iyt98U';

async function testShipmentEndpoint() {
    try {
        const melhorEnvioId = 'd4a3e9c5-5f9f-4e7e-b8f5-6c8d7e9f0hCFpBs';

        console.log('🔍 Testing shipment endpoint...');
        console.log('   Melhor Envio ID:', melhorEnvioId);

        // Try different endpoints
        const endpoints = [
            `/shipments/${melhorEnvioId}`,
            `/orders/${melhorEnvioId}`,
            `/shipment/${melhorEnvioId}`
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`\n📋 Trying: https://melhorenvio.com.br/api/v2/me${endpoint}`);

                const response = await axios.get(
                    `https://melhorenvio.com.br/api/v2/me${endpoint}`,
                    {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${MELHOR_ENVIO_TOKEN}`,
                            'User-Agent': 'Aplicação (sickgrip.br@gmail.com)'
                        }
                    }
                );

                console.log('✅ SUCCESS!');
                console.log('   Response:', JSON.stringify(response.data, null, 2));
                break;

            } catch (error) {
                console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
            }
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

testShipmentEndpoint();
