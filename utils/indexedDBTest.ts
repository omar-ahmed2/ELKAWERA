// IndexedDB Test Utility
// Run this in the browser console to test if IndexedDB is working properly

export const testIndexedDB = async () => {
    console.log('🔍 Testing IndexedDB functionality...\n');

    // Test 1: Check if IndexedDB is available
    console.log('Test 1: Checking IndexedDB availability...');
    if (!window.indexedDB) {
        console.error('❌ IndexedDB is not supported in this browser');
        return false;
    }
    console.log('✅ IndexedDB is available\n');

    // Test 2: Check storage quota
    console.log('Test 2: Checking storage quota...');
    try {
        const estimate = await navigator.storage.estimate();
        const percentUsed = ((estimate.usage || 0) / (estimate.quota || 1) * 100).toFixed(2);
        console.log(`📊 Storage used: ${(estimate.usage || 0) / 1024 / 1024} MB`);
        console.log(`📊 Storage quota: ${(estimate.quota || 0) / 1024 / 1024} MB`);
        console.log(`📊 Percentage used: ${percentUsed}%`);

        if (parseFloat(percentUsed) > 90) {
            console.warn('⚠️ Storage is almost full! Consider clearing some data.');
        } else {
            console.log('✅ Storage quota is healthy\n');
        }
    } catch (error) {
        console.error('❌ Could not check storage quota:', error);
    }

    // Test 3: Try to open the database
    console.log('Test 3: Attempting to open ElkaweraDB...');
    return new Promise((resolve) => {
        const request = indexedDB.open('ElkaweraDB', 8);

        request.onerror = (event) => {
            console.error('❌ Failed to open database:', event);
            resolve(false);
        };

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            console.log('✅ Database opened successfully');
            console.log('📋 Object stores:', Array.from(db.objectStoreNames));

            // Test 4: Check if players store exists
            console.log('\nTest 4: Checking players object store...');
            if (db.objectStoreNames.contains('players')) {
                console.log('✅ Players store exists');

                // Test 5: Try to read from players store
                console.log('\nTest 5: Reading from players store...');
                const transaction = db.transaction(['players'], 'readonly');
                const store = transaction.objectStore('players');
                const countRequest = store.count();

                countRequest.onsuccess = () => {
                    console.log(`✅ Players store contains ${countRequest.result} records`);
                };

                countRequest.onerror = (e) => {
                    console.error('❌ Failed to count players:', e);
                };
            } else {
                console.error('❌ Players store does not exist!');
            }

            db.close();
            console.log('\n✅ All tests completed!');
            resolve(true);
        };

        request.onupgradeneeded = (event) => {
            console.log('ℹ️ Database upgrade needed');
        };

        request.onblocked = () => {
            console.warn('⚠️ Database is blocked. Close other tabs with this app open.');
        };
    });
};

// Test creating a sample player
export const testCreatePlayer = async () => {
    console.log('🔍 Testing player creation...\n');

    const testPlayer = {
        id: 'test_' + Date.now(),
        name: 'Test Player',
        age: 25,
        height: 180,
        weight: 75,
        position: 'CF',
        country: 'EG',
        teamId: undefined,
        cardType: 'Silver',
        imageUrl: null,
        overallScore: 75,
        goals: 0,
        assists: 0,

        defensiveContributions: 0,
        cleanSheets: 0,
        penaltySaves: 0,
        matchesPlayed: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    console.log('Test player data:', testPlayer);

    return new Promise((resolve) => {
        const request = indexedDB.open('ElkaweraDB', 8);

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(['players'], 'readwrite');
            const store = transaction.objectStore('players');
            const addRequest = store.put(testPlayer);

            addRequest.onsuccess = () => {
                console.log('✅ Test player created successfully!');
                console.log('Player ID:', testPlayer.id);

                // Try to read it back
                const getRequest = store.get(testPlayer.id);
                getRequest.onsuccess = () => {
                    console.log('✅ Test player retrieved successfully!');
                    console.log('Retrieved data:', getRequest.result);

                    // Clean up - delete test player
                    const deleteRequest = store.delete(testPlayer.id);
                    deleteRequest.onsuccess = () => {
                        console.log('✅ Test player deleted successfully!');
                        console.log('\n✅ Player creation test passed!');
                        db.close();
                        resolve(true);
                    };
                };
            };

            addRequest.onerror = (event) => {
                console.error('❌ Failed to create test player:', event);
                const error = (event.target as IDBRequest).error;
                console.error('Error details:', error);
                db.close();
                resolve(false);
            };

            transaction.onerror = (event) => {
                console.error('❌ Transaction failed:', event);
                const error = (event.target as IDBTransaction).error;
                console.error('Error details:', error);
                db.close();
                resolve(false);
            };
        };

        request.onerror = (event) => {
            console.error('❌ Failed to open database:', event);
            resolve(false);
        };
    });
};

// Run all tests
export const runAllTests = async () => {
    console.log('🚀 Starting IndexedDB diagnostics...\n');
    console.log('='.repeat(50) + '\n');

    const dbTest = await testIndexedDB();

    if (dbTest) {
        console.log('\n' + '='.repeat(50) + '\n');
        await testCreatePlayer();
    } else {
        console.error('\n❌ Database tests failed. Cannot proceed with player creation test.');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🏁 Diagnostics complete!');
};

// Instructions for use
console.log(`
📝 IndexedDB Test Utility Loaded!

To run tests, open the browser console and run:

1. Test database availability and storage:
   testIndexedDB()

2. Test player creation:
   testCreatePlayer()

3. Run all tests:
   runAllTests()

These tests will help diagnose IndexedDB issues.
`);

// Auto-export for browser console
if (typeof window !== 'undefined') {
    (window as any).testIndexedDB = testIndexedDB;
    (window as any).testCreatePlayer = testCreatePlayer;
    (window as any).runAllTests = runAllTests;
}
