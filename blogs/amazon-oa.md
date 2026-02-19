---
title: "Cracking the Amazon OA: Robot Stability, Greedy Trucks & What I Learned"
date: "2026-02-19"
description: "A honest breakdown of two Amazon Online Assessment problems , a robot coordination stability counter and a greedy truck delivery simulator. Includes full C++ solutions, complexity analysis, and what I actually took away from the experience."
tags: ["amazon", "oa", "algorithms", "greedy", "data-structures", "interview-prep"]
categories: ["interviews", "problem-solving"]
---

# Cracking the Amazon OA: Robot Stability, Greedy Trucks & What I Learned

I gave an Amazon OA recently. It went okay , not amazing, not a disaster. I solved most of the first problem, got stuck on one part of the second, and by the end I was just tired. That kind of tired where you've been thinking hard for too long.

Amazon OAs are exactly what everyone says , the problems look simple when you first read them, but there are always edge cases hiding somewhere. This post is me going through both problems properly after the test, with full C++ solutions and honest thoughts on where I went wrong.

---

## Problem 1: Robot Coordination Stability

### The Problem

You have `n` robots. Each robot has a `coordinationThreshold[i]`. Every robot is either **Operating** or on **Standby**.

For a configuration to be valid (no malfunction):

- If robot `i` is **Operating**: at least `coordinationThreshold[i]` *other* robots must also be Operating.
- If robot `i` is on **Standby**: total operating robots must be *strictly less than* `coordinationThreshold[i]`.

Count how many valid configurations exist out of all `2^n` possibilities.

### How to Think About It

Checking all `2^n` subsets is not going to work. Way too slow.

So instead, think about it this way , say exactly `k` robots are Operating. For this to be valid, every one of those k robots must have `coordinationThreshold[i] <= k - 1` (because each of them needs at least that many others running along with them). And every standby robot must have `coordinationThreshold[i] > k`.

So now the question becomes: **for a given k, do exactly k robots satisfy `threshold <= k - 1`?**

Just sort the thresholds, loop k from 1 to n, and use binary search to count how many thresholds are `<= k - 1`. If that count is exactly k, it's a valid configuration. That's the whole trick.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

int getValidConfigurations(vector<int> coordinationThreshold) {

    sort(coordinationThreshold.begin(), coordinationThreshold.end());

    int n = coordinationThreshold.size();
    int count = 0;

    for (int k = 1; k <= n; k++) {

        int eligible = (int)(upper_bound(
            coordinationThreshold.begin(),
            coordinationThreshold.end(),
            k - 1
        ) - coordinationThreshold.begin());

        if (eligible == k) {
            count++;
        }
    }

    return count;
}
```

### Time Complexity

- Sorting: `O(n log n)`
- Loop with binary search: `O(n log n)`
- Total: `O(n log n)` , easily handles large inputs.

---

## Problem 2: Can All Packages Be Delivered?

### The Problem

You have trucks with capacities `truckCapacities[n]` and packages with weights `packageWeights[m]`.

Rules:

- A truck can pick up a package only if `capacity >= weight`.
- After delivering, the truck's capacity becomes `floor(capacity / 2)`.

For each test case, return `1` if all packages can be delivered, else `0`.

### How to Think About It

This is a greedy problem. The main question is , which truck should carry which package?

Since capacity reduces after every delivery, you don't want to waste your strongest truck on a light package. The right move is: always pick the heaviest package first and use the strongest available truck for it. This way you're not leaving a heavy package for later when all trucks are already weak.

So , sort packages in decreasing order, use a max-heap for trucks, and simulate one by one.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

vector<int> canAllPackagesBeDelivered(
    vector<vector<int>> truckCapacities,
    vector<vector<int>> packageWeights)
{
    int t = truckCapacities.size();
    vector<int> result;

    for (int i = 0; i < t; i++) {

        priority_queue<long long> pq;

        for (auto cap : truckCapacities[i]) {
            pq.push(cap);
        }

        vector<long long> packages(packageWeights[i].begin(),
                                   packageWeights[i].end());

        sort(packages.begin(), packages.end(), greater<long long>());

        bool possible = true;

        for (auto weight : packages) {

            if (pq.empty() || pq.top() < weight) {
                possible = false;
                break;
            }

            long long topCap = pq.top();
            pq.pop();

            long long newCap = topCap / 2;

            if (newCap > 0) {
                pq.push(newCap);
            }
        }

        result.push_back(possible ? 1 : 0);
    }

    return result;
}
```

### Time Complexity

- Sorting packages: `O(m log m)`
- Heap operations: `O(m log n)`
- Per test case: `O((n + m) log n)`

---

## What I Learned From This

**With greedy, you need to know *why* it works.** The truck solution feels obvious once you see it , strong truck takes heavy package, makes sense right? But during the exam you start doubting yourself. If you know the actual reason behind the greedy choice, you stop second-guessing and just go with it.

**Counting problems with big search space , try sorting first.** The robot problem looks scary because of 2^n combinations. But once you stop thinking "which robots are operating?" and start thinking "how many robots are operating?", the whole thing becomes a simple sort and binary search. That shift in thinking is everything.

**Solving after the exam hits differently.** I couldn't crack one sub-case during the test. Later that night I sat down with it calmly and figured it out in maybe 20 minutes. Time pressure genuinely messes with your brain.

---

## If You're Preparing

Practice greedy problems, especially ones where some resource reduces over time. Get comfortable with max-heaps for allocation problems. When you see a counting problem with exponential possibilities, try sorting and see if it makes things simpler. And please , read the problem twice before writing a single line of code. I've wasted so much time coding the wrong thing.

The OA was hard, but it was fair. I know what I need to work on now, and honestly that's enough for me.
