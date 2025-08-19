#!/usr/bin/env python3
"""
Phoenix Flying Game Backend API Test Suite
Tests all backend endpoints for the Phoenix Flying Game MVP
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=')[1].strip()
    except:
        pass
    return "https://skyborne.preview.emergentagent.com"

BASE_URL = get_backend_url() + "/api"
print(f"Testing Phoenix Flying Game API at: {BASE_URL}")

# Test data
TEST_PLAYER_ID = "test_player_123"
INVALID_PLAYER_ID = "nonexistent_player"

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def log_pass(self, test_name):
        print(f"✅ PASS: {test_name}")
        self.passed += 1
    
    def log_fail(self, test_name, error):
        print(f"❌ FAIL: {test_name} - {error}")
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed")
        if self.errors:
            print(f"\nFAILED TESTS:")
            for error in self.errors:
                print(f"  - {error}")
        print(f"{'='*60}")
        return self.failed == 0

results = TestResults()

def test_api_root():
    """Test GET /api/ - Should return Phoenix Flying Game API message"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        
        if response.status_code != 200:
            results.log_fail("API Root Endpoint", f"Expected status 200, got {response.status_code}")
            return
        
        data = response.json()
        if "message" not in data or "Phoenix Flying Game API" not in data["message"]:
            results.log_fail("API Root Endpoint", f"Expected 'Phoenix Flying Game API' message, got: {data}")
            return
        
        results.log_pass("API Root Endpoint")
        
    except Exception as e:
        results.log_fail("API Root Endpoint", f"Request failed: {str(e)}")

def test_moves_available():
    """Test GET /api/moves/available - Should return 15 moves with proper structure"""
    try:
        response = requests.get(f"{BASE_URL}/moves/available", timeout=10)
        
        if response.status_code != 200:
            results.log_fail("Moves Available Endpoint", f"Expected status 200, got {response.status_code}")
            return
        
        data = response.json()
        
        # Check structure
        if "moves" not in data or "total" not in data:
            results.log_fail("Moves Available Endpoint", f"Missing 'moves' or 'total' in response: {data}")
            return
        
        moves = data["moves"]
        total = data["total"]
        
        # Check total count
        if total != 15:
            results.log_fail("Moves Available Endpoint", f"Expected 15 total moves, got {total}")
            return
        
        if len(moves) != 15:
            results.log_fail("Moves Available Endpoint", f"Expected 15 moves in array, got {len(moves)}")
            return
        
        # Check move types distribution
        hold_moves = [m for m in moves if m["type"] == "hold"]
        double_moves = [m for m in moves if m["type"] == "double"]
        triple_moves = [m for m in moves if m["type"] == "triple"]
        
        if len(hold_moves) != 5:
            results.log_fail("Moves Available Endpoint", f"Expected 5 hold moves, got {len(hold_moves)}")
            return
        
        if len(double_moves) != 5:
            results.log_fail("Moves Available Endpoint", f"Expected 5 double moves, got {len(double_moves)}")
            return
        
        if len(triple_moves) != 5:
            results.log_fail("Moves Available Endpoint", f"Expected 5 triple moves, got {len(triple_moves)}")
            return
        
        # Check move structure
        required_fields = ["id", "name", "type", "damage", "cooldown", "cost", "description", "color"]
        for move in moves[:3]:  # Check first 3 moves
            for field in required_fields:
                if field not in move:
                    results.log_fail("Moves Available Endpoint", f"Move missing required field '{field}': {move}")
                    return
        
        # Check damage/cooldown/cost balancing
        starter_moves = [m for m in moves if m["cost"] == 0]
        if len(starter_moves) != 3:
            results.log_fail("Moves Available Endpoint", f"Expected 3 starter moves (cost=0), got {len(starter_moves)}")
            return
        
        results.log_pass("Moves Available Endpoint")
        
    except Exception as e:
        results.log_fail("Moves Available Endpoint", f"Request failed: {str(e)}")

def test_create_game_progress():
    """Test POST /api/game/progress - Create new game progress"""
    try:
        # First, try to delete existing progress to ensure clean test
        try:
            requests.delete(f"{BASE_URL}/game/progress/{TEST_PLAYER_ID}", timeout=5)
        except:
            pass  # Ignore if delete fails
        
        payload = {
            "playerId": TEST_PLAYER_ID
        }
        
        response = requests.post(f"{BASE_URL}/game/progress", json=payload, timeout=10)
        
        if response.status_code != 200:
            results.log_fail("Create Game Progress", f"Expected status 200, got {response.status_code}. Response: {response.text}")
            return
        
        data = response.json()
        
        # Check required fields
        required_fields = ["id", "playerId", "playerStats", "worldProgress", "ownedMoves"]
        for field in required_fields:
            if field not in data:
                results.log_fail("Create Game Progress", f"Missing required field '{field}' in response")
                return
        
        # Check player ID matches
        if data["playerId"] != TEST_PLAYER_ID:
            results.log_fail("Create Game Progress", f"Expected playerId '{TEST_PLAYER_ID}', got '{data['playerId']}'")
            return
        
        # Check default stats
        stats = data["playerStats"]
        expected_stats = {
            "level": 1,
            "xp": 0,
            "xpToNext": 100,
            "health": 100,
            "maxHealth": 100,
            "coins": 50
        }
        
        for key, expected_value in expected_stats.items():
            if stats.get(key) != expected_value:
                results.log_fail("Create Game Progress", f"Expected {key}={expected_value}, got {stats.get(key)}")
                return
        
        # Check world progress (10 worlds, first unlocked)
        worlds = data["worldProgress"]
        if len(worlds) != 10:
            results.log_fail("Create Game Progress", f"Expected 10 worlds, got {len(worlds)}")
            return
        
        # Check first world is unlocked
        if not worlds[0]["unlocked"]:
            results.log_fail("Create Game Progress", "First world should be unlocked")
            return
        
        # Check other worlds are locked
        for i in range(1, 10):
            if worlds[i]["unlocked"]:
                results.log_fail("Create Game Progress", f"World {i+1} should be locked initially")
                return
        
        # Check starter moves
        owned_moves = data["ownedMoves"]
        expected_starter_moves = ["hold_1", "double_1", "triple_1"]
        for move in expected_starter_moves:
            if move not in owned_moves:
                results.log_fail("Create Game Progress", f"Missing starter move '{move}' in ownedMoves")
                return
        
        results.log_pass("Create Game Progress")
        
    except Exception as e:
        results.log_fail("Create Game Progress", f"Request failed: {str(e)}")

def test_get_game_progress():
    """Test GET /api/game/progress/{player_id} - Retrieve game progress"""
    try:
        response = requests.get(f"{BASE_URL}/game/progress/{TEST_PLAYER_ID}", timeout=10)
        
        if response.status_code != 200:
            results.log_fail("Get Game Progress", f"Expected status 200, got {response.status_code}. Response: {response.text}")
            return
        
        data = response.json()
        
        # Check basic structure
        if data["playerId"] != TEST_PLAYER_ID:
            results.log_fail("Get Game Progress", f"Expected playerId '{TEST_PLAYER_ID}', got '{data['playerId']}'")
            return
        
        # Check that we have the expected data structure
        required_fields = ["id", "playerId", "playerStats", "worldProgress", "ownedMoves"]
        for field in required_fields:
            if field not in data:
                results.log_fail("Get Game Progress", f"Missing required field '{field}' in response")
                return
        
        results.log_pass("Get Game Progress")
        
    except Exception as e:
        results.log_fail("Get Game Progress", f"Request failed: {str(e)}")

def test_get_nonexistent_progress():
    """Test GET /api/game/progress/{invalid_id} - Should return 404"""
    try:
        response = requests.get(f"{BASE_URL}/game/progress/{INVALID_PLAYER_ID}", timeout=10)
        
        if response.status_code != 404:
            results.log_fail("Get Nonexistent Progress", f"Expected status 404, got {response.status_code}")
            return
        
        results.log_pass("Get Nonexistent Progress")
        
    except Exception as e:
        results.log_fail("Get Nonexistent Progress", f"Request failed: {str(e)}")

def test_update_game_progress():
    """Test PUT /api/game/progress/{player_id} - Update game progress"""
    try:
        # Update player stats
        update_payload = {
            "playerStats": {
                "level": 2,
                "xp": 150,
                "xpToNext": 200,
                "health": 90,
                "maxHealth": 100,
                "coins": 75
            },
            "deathCount": 1
        }
        
        response = requests.put(f"{BASE_URL}/game/progress/{TEST_PLAYER_ID}", json=update_payload, timeout=10)
        
        if response.status_code != 200:
            results.log_fail("Update Game Progress", f"Expected status 200, got {response.status_code}. Response: {response.text}")
            return
        
        data = response.json()
        
        # Check that updates were applied
        stats = data["playerStats"]
        if stats["level"] != 2:
            results.log_fail("Update Game Progress", f"Expected level=2, got {stats['level']}")
            return
        
        if stats["coins"] != 75:
            results.log_fail("Update Game Progress", f"Expected coins=75, got {stats['coins']}")
            return
        
        if data.get("deathCount") != 1:
            results.log_fail("Update Game Progress", f"Expected deathCount=1, got {data.get('deathCount')}")
            return
        
        results.log_pass("Update Game Progress")
        
    except Exception as e:
        results.log_fail("Update Game Progress", f"Request failed: {str(e)}")

def test_update_nonexistent_progress():
    """Test PUT /api/game/progress/{invalid_id} - Should return 404"""
    try:
        update_payload = {
            "playerStats": {
                "level": 2,
                "coins": 100
            }
        }
        
        response = requests.put(f"{BASE_URL}/game/progress/{INVALID_PLAYER_ID}", json=update_payload, timeout=10)
        
        if response.status_code != 404:
            results.log_fail("Update Nonexistent Progress", f"Expected status 404, got {response.status_code}")
            return
        
        results.log_pass("Update Nonexistent Progress")
        
    except Exception as e:
        results.log_fail("Update Nonexistent Progress", f"Request failed: {str(e)}")

def main():
    print("🔥 Phoenix Flying Game Backend API Test Suite 🔥")
    print(f"Testing against: {BASE_URL}")
    print("=" * 60)
    
    # Run all tests
    test_api_root()
    test_moves_available()
    test_create_game_progress()
    test_get_game_progress()
    test_get_nonexistent_progress()
    test_update_game_progress()
    test_update_nonexistent_progress()
    
    # Print summary
    success = results.summary()
    
    if success:
        print("\n🎉 All backend tests passed! Phoenix Flying Game API is working correctly.")
        sys.exit(0)
    else:
        print(f"\n💥 {results.failed} backend tests failed. See details above.")
        sys.exit(1)

if __name__ == "__main__":
    main()